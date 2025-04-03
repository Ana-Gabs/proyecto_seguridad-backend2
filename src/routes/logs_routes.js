// ./routes/logs_routes.js
const express = require('express');
const { getLogsByLevel, getLogsByResponseTime, getLogsByStatus } = require('../controllers/logs_controller');
const limiter = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

// Rutas para obtener logs
//router.get('/level', limiter,getLogsByLevel);  
router.get('/level',getLogsByLevel);  
//router.get('/time', limiter,getLogsByResponseTime);  
router.get('/time', getLogsByResponseTime);  
//router.get('/status', limiter,getLogsByStatus);  
router.get('/status', getLogsByStatus);  

module.exports = router;
