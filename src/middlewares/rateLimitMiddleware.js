// ./middleware/rateLimitMiddleware.js
const rateLimit = require("express-rate-limit");

// Rate Limit: 100 requests cada 10 minutos
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: "Demasiadas peticiones, intenta más tarde."
});

module.exports = limiter;
