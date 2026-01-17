const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:9000', // Yahan 5123 ki jagah 9000 karein
      changeOrigin: true,
    })
  );
};