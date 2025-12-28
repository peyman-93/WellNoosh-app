const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Check if running on Replit
const isReplit = process.env.REPL_ID || process.env.REPLIT_ENVIRONMENT;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    // Only set up proxy on Replit where external port access is limited
    if (isReplit) {
      try {
        const { createProxyMiddleware } = require('http-proxy-middleware');
        return (req, res, next) => {
          if (req.url.startsWith('/api')) {
            const proxy = createProxyMiddleware({
              target: 'http://localhost:3000',
              changeOrigin: true,
              logLevel: 'warn',
            });
            return proxy(req, res, next);
          }
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return middleware(req, res, next);
        };
      } catch (e) {
        console.warn('http-proxy-middleware not available, skipping proxy setup');
      }
    }
    
    // Default middleware for local development
    return (req, res, next) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;