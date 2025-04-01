// ./logs/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDirectory = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: path.join(logDirectory, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDirectory, 'combined.log') }),
    new winston.transports.File({ filename: path.join(logDirectory, 'all.log'), level: 'info' }),
  ],
});

module.exports = logger;
