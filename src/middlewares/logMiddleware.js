const logger = require('../logs/logger');

const logMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    const responseTime = Date.now() - startTime;

    const logData = {
      timestamp: new Date(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };

    logger.log({
      level: logLevel,
      message: 'Request log',
      ...logData
    });

    logger.info(logData);
  });

  next();
};

module.exports = logMiddleware;
