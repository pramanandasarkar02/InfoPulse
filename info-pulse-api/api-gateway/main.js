const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Service URLs from Docker Compose configuration
const services = {
  newsfetching: 'http://localhost:4041',
  newsprocessing: 'http://localhost:4042',
  userservice: 'http://localhost:4043',
  usersearching: 'http://localhost:4044',
  newsrecommendation: 'http://localhost:4045',
  usermonitoring: 'http://localhost:4046'
};

// Proxy middleware options
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({
      error: 'Service unavailable',
      message: 'Failed to connect to the requested service'
    });
  }
};

// Route definitions
app.use('/api/news/fetch', createProxyMiddleware({
  ...proxyOptions,
  target: services.newsfetching
}));


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});