import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
import winston from 'winston';
import expressWinston from 'express-winston';

dotenv.config();

const app = express();
const port = process.env.GATEWAY_PORT || 8080;

// Service URLs
const SERVICES = {
    AUTH_SERvice: process.env.AUTH_SERvice_URL || 'http://localhost:3000',
    NEWS_FETCHING: process.env.NEWS_FETCHING_SERVICE_URL || 'http://localhost:3001',
    NEWS_PROCESSING: process.env.NEWS_PROCESSING_SERVICE_URL || 'http://localhost:3002',
    RECOMMENDATION_SERVICE: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3005'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'api-gateway' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Middleware setup
app.use(helmet()); // Security headers
app.use(compression()); // Response compression
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: true,
    ignoreRoute: function (req, res) { return false; }
}));

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/gateway/health';
    }
});

// Different rate limits for different endpoints
const generalLimiter = createRateLimit(15 * 60 * 1000, 1000, 'Too many requests'); // 1000 requests per 15 minutes
const authLimiter = createRateLimit(15 * 60 * 1000, 50, 'Too many authentication attempts'); // 50 requests per 15 minutes
const adminLimiter = createRateLimit(15 * 60 * 1000, 200, 'Too many admin requests'); // 200 requests per 15 minutes

// Apply general rate limiting
app.use(generalLimiter);

// Service health check utility
const checkServiceHealth = async (serviceName, url) => {
    try {
        const response = await axios.get(`${url}/health`, { timeout: 5000 });
        return {
            service: serviceName,
            status: 'healthy',
            url,
            responseTime: response.headers['x-response-time'] || 'N/A'
        };
    } catch (error) {
        return {
            service: serviceName,
            status: 'unhealthy',
            url,
            error: error.message
        };
    }
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify token locally first
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // Validate token with user service
        try {
            const response = await axios.get(`${SERVICES.AUTH_SERvice}/validate`, {
                params: { token },
                timeout: 5000
            });
            
            req.user = response.data.user;
            req.user.userId = decoded.userId; // Ensure userId is available
            req.user.role = decoded.role; // Ensure role is available
            next();
        } catch (error) {
            if (error.response && error.response.status === 401) {
                return res.status(401).json({ error: 'Token validation failed' });
            }
            logger.error('Token validation service error:', error);
            // Fallback to local token validation if service is down
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role
            };
            next();
        }
    } catch (error) {
        logger.error('Authentication middleware error:', error);
        res.status(500).json({ error: 'Authentication service error' });
    }
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Super admin role check middleware
const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
};

// Gateway health check
app.get('/health', async (req, res) => {
    const serviceHealthChecks = await Promise.all([
        checkServiceHealth('News Fetching Service', SERVICES.NEWS_FETCHING),
        checkServiceHealth('News Processing Service', SERVICES.NEWS_PROCESSING),
        checkServiceHealth('User Service', SERVICES.AUTH_SERvice)
    ]);

    const overallHealth = serviceHealthChecks.every(service => service.status === 'healthy');

    res.status(overallHealth ? 200 : 503).json({
        gateway: 'healthy',
        timestamp: new Date().toISOString(),
        services: serviceHealthChecks,
        overall: overallHealth ? 'healthy' : 'degraded'
    });
});

// Gateway info endpoint
app.get('/gateway/info', (req, res) => {
    res.json({
        name: 'Info Pulse API Gateway',
        version: '1.0.0',
        services: {
            'news-fetching': `${SERVICES.NEWS_FETCHING}`,
            'news-processing': `${SERVICES.NEWS_PROCESSING}`,
            'user-service': `${SERVICES.AUTH_SERvice}`
        },
        endpoints: {
            // Authentication endpoints
            'POST /auth/signup': 'User registration',
            'POST /auth/login': 'User login',
            'GET /auth/validate': 'Token validation',
            'GET /auth/profile': 'Get user profile (authenticated)',
            'PUT /auth/profile': 'Update user profile (authenticated)',
            'PUT /auth/change-password': 'Change password (authenticated)',
            
            // Admin endpoints
            'GET /admin/users': 'Get all users (admin)',
            'PUT /admin/users/:id/role': 'Update user role (super admin)',
            'PUT /admin/users/:id/status': 'Update user status (admin)',
            'DELETE /admin/users/:id': 'Delete user (super admin)',
            'GET /admin/logs': 'Get admin logs (admin)',
            'GET /admin/stats': 'Get dashboard stats (admin)',
            
            // News fetching endpoints
            'GET /news/categories': 'Get news categories',
            'GET /news/articles': 'Get articles with filters',
            'POST /news/articles': 'Add new article (admin)',
            'GET /news/articles/:category': 'Get articles by category',
            'GET /news/stats': 'Get news statistics',
            
            // News processing endpoints
            'POST /processing/process-article': 'Process single article (admin)',
            'POST /processing/process-all': 'Process all articles (admin)',
            'GET /processing/articles': 'Get processed articles',
            'GET /processing/articles/category/:category': 'Get articles by category',
            'GET /processing/articles/tag/:tag': 'Get articles by tag',
            'GET /processing/articles/author/:author': 'Get articles by author',
            'GET /processing/articles/publication/:publication': 'Get articles by publication',
            'GET /processing/articles/:id': 'Get article by ID',
            'GET /processing/stats': 'Get processing statistics',
            'POST /processing/check-duplicate': 'Check for duplicate articles',
            'GET /processing/duplicates': 'Get duplicate articles',
            'DELETE /processing/duplicates/cleanup': 'Clean up duplicates (admin)',
            
            // Gateway endpoints
            'GET /health': 'Gateway and services health check',
            'GET /gateway/info': 'Gateway information'
        }
    });
});

// AUTHENTICATION ROUTES (User Service)
app.use('/auth/signup', authLimiter);
app.use('/auth/login', authLimiter);

app.use('/auth', createProxyMiddleware({
    target: SERVICES.AUTH_SERvice,
    changeOrigin: true,
    pathRewrite: {
        '^/auth/signup': '/signup',
        '^/auth/login': '/login',
        '^/auth/validate': '/validate',
        '^/auth/profile': '/profile',
        '^/auth/change-password': '/change-password'
    },
    onError: (err, req, res) => {
        logger.error('User service proxy error:', err);
        res.status(503).json({ error: 'User service unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying ${req.method} ${req.originalUrl} to user service`);

        // Log full info for debugging
        logger.info('Query:', req.query);
        logger.info('Params:', req.params);
        logger.info('Body:', req.body);
        logger.info('Headers:', req.headers);

        // Manually forward body for POST/PUT/PATCH
        if (
            ['POST', 'PUT', 'PATCH'].includes(req.method) &&
            req.body &&
            Object.keys(req.body).length > 0
        ) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }

        // Manually forward headers
        const headersToForward = ['authorization'];
        headersToForward.forEach((key) => {
            if (req.headers[key] && !proxyReq.getHeader(key)) {
                proxyReq.setHeader(key, req.headers[key]);
            }
        });
    }
}));

app.use("/users/all", createProxyMiddleware({
    target: SERVICES.AUTH_SERvice,
    changeOrigin: true,
    pathRewrite: {
        '^/users/all': '/users/all'
    },
    onError: (err, req, res) => {
        logger.error('User service proxy error:', err);
        res.status(503).json({ error: 'User service unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying ${req.method} ${req.originalUrl} to user service`);
    }


}))


// ADMIN ROUTES (User Service) - Requires authentication and admin role
app.use('/admin', authenticateToken, adminLimiter);

app.use('/admin', createProxyMiddleware({
    target: SERVICES.AUTH_SERvice,
    changeOrigin: true,
    pathRewrite: {
        '^/admin': '/admin'
    },
    onError: (err, req, res) => {
        logger.error('Admin service proxy error:', err);
        res.status(503).json({ error: 'Admin service unavailable' });
    },
}));

// NEWS FETCHING ROUTES
app.use('/news', createProxyMiddleware({
    target: SERVICES.NEWS_FETCHING,
    changeOrigin: true,
    pathRewrite: {
        '^/news': ''
    },
    onError: (err, req, res) => {
        logger.error('News fetching service proxy error:', err);
        res.status(503).json({ error: 'News fetching service unavailable' });
    },
    // Add authentication for POST requests
    onProxyReq: (proxyReq, req, res) => {
        if (req.method === 'POST') {
            // Check if user is authenticated and is admin
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
                res.status(403).json({ error: 'Admin access required for POST operations' });
                return;
            }
        }
        logger.info(`Proxying ${req.method} ${req.originalUrl} to news fetching service`);
        // Log full info for debugging
    logger.info('Query:', req.query);
    logger.info('Params:', req.params);
    logger.info('Body:', req.body);

    // Manually forward body for POST/PUT/PATCH
    if (
        ['POST', 'PUT', 'PATCH'].includes(req.method) &&
        req.body &&
        Object.keys(req.body).length > 0
    ) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
    }
}));

// Apply authentication middleware for POST requests to news service
app.post('/news/*', authenticateToken, requireAdmin);

// NEWS PROCESSING ROUTES
// Protected routes (require authentication)
const protectedProcessingRoutes = [
    '/processing/process-article',
    '/processing/process-all',
    '/processing/duplicates/cleanup'
];

protectedProcessingRoutes.forEach(route => {
    app.use(route, authenticateToken, requireAdmin);
});

app.use('/processing', createProxyMiddleware({
    target: SERVICES.NEWS_PROCESSING,
    changeOrigin: true,
    pathRewrite: {
        '^/processing': '/api'
    },
    onError: (err, req, res) => {
        logger.error('News processing service proxy error:', err);
        res.status(503).json({ error: 'News processing service unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying ${req.method} ${req.originalUrl} to news processing service`);
        // Log full info for debugging
        logger.info('Query:', req.query);
        logger.info('Params:', req.params);
        logger.info('Body:', req.body);

        // Manually forward body for POST/PUT/PATCH
        if (
            ['POST', 'PUT', 'PATCH'].includes(req.method) &&
            req.body &&
            Object.keys(req.body).length > 0
        ) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }   
    }
}));


// non autherized routes
app.get('/news/categories', createProxyMiddleware({
    target: SERVICES.NEWS_FETCHING,
    changeOrigin: true,
    pathRewrite: {
        '^/categories': '/categories'
    },
    onError: (err, req, res) => {
        logger.error('News processing service proxy error:', err);  
        res.status(503).json({ error: 'News processing service unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {

        logger.info(`Proxying ${req.method} ${req.originalUrl} to news processing service`);
        // Log full info for debugging
        logger.info('Query:', req.query);
        logger.info('Params:', req.params);
        logger.info('Body:', req.body);
        

        


    }
}));

app.post('/articles', createProxyMiddleware({
    target: SERVICES.NEWS_FETCHING,
    changeOrigin: true,
    pathRewrite: {
        '^/articles': '/articles'
    },
    onError: (err, req, res) => {
        logger.error('News processing service proxy error:', err);  
        res.status(503).json({ error: 'News processing service unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying ${req.method} ${req.originalUrl} to news processing service`);
        // Log full info for debugging
        logger.info('Query:', req.query);
        logger.info('Params:', req.params);
        logger.info('Body:', req.body);

        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }

    }   
}))

app.get('/stats', createProxyMiddleware({
    target: SERVICES.NEWS_PROCESSING,
    changeOrigin: true,
    pathRewrite: {
        '^/stats': '/stats'
    },
    onError: (err, req, res) => {
        logger.error('News processing service proxy error:', err);  
        res.status(503).json({ error: 'News processing service unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying ${req.method} ${req.originalUrl} to news processing service`);
        // Log full info for debugging
        logger.info('Query:', req.query);
        logger.info('Params:', req.params);
        logger.info('Body:', req.body);
    }
}))


app.get('/articles/title/:title', createProxyMiddleware({
    target: SERVICES.NEWS_PROCESSING,
    changeOrigin: true,
    pathRewrite: (path, req) => {
        // Dynamically rewrite path to preserve the title parameter
        const title = encodeURIComponent(decodeURIComponent(req.params.title));
        return `/api/articles/title/${title}`;
    },
    onError: (err, req, res) => {
        logger.error('Proxy error:', {
            error: err.message,
            code: err.code,
            stack: err.stack,
            url: req.originalUrl,
            target: SERVICES.NEWS_PROCESSING
        });
        res.status(503).json({
            error: 'News processing service unavailable',
            details: err.message
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying ${req.method} ${req.originalUrl} to ${SERVICES.NEWS_PROCESSING}`);
        logger.info('Query:', req.query);
        logger.info('Params:', req.params);
        logger.info('Body:', req.body);
        logger.info('Proxy request path:', proxyReq.path);

        // Add custom headers for debugging
        proxyReq.setHeader('X-Proxy-Source', 'API-Gateway');
        proxyReq.setHeader('X-Original-URL', req.originalUrl);

        // Handle body for POST/PUT/PATCH (optional for future-proofing)
        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        logger.info(`Received response from news processing service: ${proxyRes.statusCode}`);
        logger.info('Response headers:', proxyRes.headers);
    }
}));




app.get('/articles', createProxyMiddleware({
    target: SERVICES.NEWS_PROCESSING,
    changeOrigin: true,
    pathRewrite: {
        '^/articles': '/api/articles'
    },
    onError: (err, req, res) => {
        logger.error('News processing service proxy error:', err);
        res.status(503).json({ error: 'News processing service unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying ${req.method} ${req.originalUrl} to news processing service`);
        // Log full info for debugging
        logger.info('Query:', req.query);
        logger.info('Params:', req.params);
        logger.info('Body:', req.body);

    }

}))

app.get("/recommendations/:userId", createProxyMiddleware({
    target: SERVICES.NEWS_PROCESSING,
    changeOrigin: true,
    pathRewrite: {
        '^/recommendations/:userId': '/api/recommendations/:userId'
    },
    onError: (err, req, res) => {
        logger.error('News processing service proxy error:', err);
        res.status(503).json({ error: 'News processing service unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying ${req.method} ${req.originalUrl} to news processing service`);
        // Log full info for debugging
        logger.info('Query:', req.query);
        logger.info('Params:', req.params);
        logger.info('Body:', req.body);
    }
}))






// Service discovery endpoint
app.get('/gateway/services', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const serviceHealthChecks = await Promise.all([
            checkServiceHealth('News Fetching Service', SERVICES.NEWS_FETCHING),
            checkServiceHealth('News Processing Service', SERVICES.NEWS_PROCESSING),
            checkServiceHealth('User Service', SERVICES.AUTH_SERvice)
        ]);

        res.json({
            services: serviceHealthChecks,
            gateway: {
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0'
            }
        });
    } catch (error) {
        logger.error('Service discovery error:', error);
        res.status(500).json({ error: 'Failed to check service status' });
    }
});

// Metrics endpoint (admin only)
app.get('/gateway/metrics', authenticateToken, requireAdmin, (req, res) => {
    res.json({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use(expressWinston.errorLogger({
    winstonInstance: logger
}));

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `The requested route ${req.method} ${req.originalUrl} does not exist`,
        availableRoutes: [
            'GET /health - Gateway health check',
            'GET /gateway/info - Gateway information',
            'POST /auth/signup - User registration',
            'POST /auth/login - User login',
            'GET /auth/profile - User profile (authenticated)',
            'GET /admin/users - Admin user management',
            'GET /news/articles - Get news articles',
            'GET /processing/articles - Get processed articles'
        ]
    });
});

// Global error handler
app.use((error, req, res, next) => {
    logger.error('Global error handler:', error);
    
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large' });
    }
    
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    
    const server = app.listen(port);
    
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
const startServer = () => {
    app.listen(port, () => {
        logger.info(`API Gateway running on port ${port}`);
        logger.info('Services configuration:');
        logger.info(`- News Fetching Service: ${SERVICES.NEWS_FETCHING}`);
        logger.info(`- News Processing Service: ${SERVICES.NEWS_PROCESSING}`);
        logger.info(`- User Service: ${SERVICES.AUTH_SERvice}`);
        logger.info(`\nGateway endpoints:`);
        logger.info(`- Health Check: http://localhost:${port}/health`);
        logger.info(`- Gateway Info: http://localhost:${port}/gateway/info`);
        logger.info(`- API Documentation: http://localhost:${port}/gateway/info`);
    });
};

startServer();

export default app;