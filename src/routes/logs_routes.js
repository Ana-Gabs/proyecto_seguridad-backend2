// ./routes/logsss_routes.js
const express = require('express');
const { getLogsServer1, getLogsServer2 } = require('../controllers/logs_controller');

const router = express.Router();

// Rutas para obtener logs
router.get('/server1' ,getLogsServer1);  
router.get('/server2',getLogsServer2);  

module.exports = router;
