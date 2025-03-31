const winston = require('winston');
const path = require('path');

const logDirectory = path.join(__dirname, '../../logs');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: `${logDirectory}/error.log`, level: 'error' }),
    new winston.transports.File({ filename: `${logDirectory}/combined.log` }),
    new winston.transports.File({ filename: `${logDirectory}/all.log`, level: 'info' }), // 👈 Agregamos all.log
  ],
});

module.exports = logger;
