const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

// Service URLs from environment variables or default to Docker Compose configuration
const services = {
  newsfetching: process.env.NEWSFETCHING_SERVICE_URL || 'http://newsfetching:3001',
  newsprocessing: process.env.NEWSPROCESSING_SERVICE_URL || 'http://newsprocessing:3002',
  userservice: process.env.USERSERVICE_URL || 'http://userservice:3003',
  usersearching: process.env.USERSEARCHING_URL || 'http://usersearching:3004',
  newsrecommendation: process.env.NEWSRECOMMENDATION_URL || 'http://newsrecommendation:3005',
  usermonitoring: process.env.USERMONITORING_URL || 'http://usermonitoring:3006'
};

// Middleware configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.'
  }
});
app.use(limiter);

// Proxy middleware options
const proxyOptions = {
  changeOrigin: true,
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  onError: (err, req, res) => {
    console.error(`Proxy error for ${req.path}:`, err.message);
    res.status(503).json({
      error: 'Service unavailable',
      message: 'Failed to connect to the requested service',
      code: 'SERVICE_UNAVAILABLE'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add custom header for tracking
    proxyReq.setHeader('X-API-Gateway', 'InfoPulse');
  }
};

// Proxy routes for all services
app.use('/api/v1/news/fetch', createProxyMiddleware({
  ...proxyOptions,
  target: services.newsfetching,
  pathRewrite: { '^/api/v1/news/fetch': '' }
}));

app.use('/api/v1/news/process', createProxyMiddleware({
  ...proxyOptions,
  target: services.newsprocessing,
  pathRewrite: { '^/api/v1/news/process': '' }
}));

app.use('/api/v1/user', createProxyMiddleware({
  ...proxyOptions,
  target: services.userservice,
  pathRewrite: { '^/api/v1/user': '' }
}));

app.use('/api/v1/user/search', createProxyMiddleware({
  ...proxyOptions,
  target: services.usersearching,
  pathRewrite: { '^/api/v1/user/search': '' }
}));

app.use('/api/v1/news/recommend', createProxyMiddleware({
  ...proxyOptions,
  target: services.newsrecommendation,
  pathRewrite: { '^/api/v1/news/recommend': '' }
}));

app.use('/api/v1/monitoring', createProxyMiddleware({
  ...proxyOptions,
  target: services.usermonitoring,
  pathRewrite: { '^/api/v1/monitoring': '' }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    services: Object.keys(services).map(key => ({
      name: key,
      url: services[key]
    }))
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'InfoPulse API Gateway',
    version: '1.0.0',
    endpoints: Object.keys(services).map(key => `/api/v1/${key.replace('service', '')}`)
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not found',
    message: `The requested resource ${req.path} was not found`,
    code: 'NOT_FOUND'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🔐 Redacted' : err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// Start server
app.listen(port, () => {
  console.log(`API Gateway running at http://localhost:${port}`);
  console.log('Registered services:', services);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit process in production to prevent crashing
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});