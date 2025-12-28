const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Proxy API requests to the backend server
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
  },
};

module.exports = config;