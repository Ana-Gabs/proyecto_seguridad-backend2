// ./routes/logs_routes.js
const express = require('express');
const { getLogsServer1, getLogsServer2 } = require('../controllers/logs_controller');
const limiter = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

// Rutas para obtener logs
router.get('/server1', limiter,getLogsServer1);  
router.get('/server2', limiter,getLogsServer2);  

module.exports = router;
