// ./controllers/logs_controller.js
const { db } = require('../config/firebase');
const { logAction } = require("../utils/logger");

exports.getLogsByLevel = async (req, res) => {
  try {
    const logsSnap = await db.collection('logs2').get();
    const logs = logsSnap.docs.map(doc => doc.data());

    // Agrupar los logs por nivel (logLevel)
    const groupedByLevel = logs.reduce((acc, log) => {
      const level = log.logLevel || "unknown";
      if (!acc[level]) {
        acc[level] = 0;
      }
      acc[level] += 1;
      return acc;
    }, {});

    // Registrar la acción que se está realizando
    await logAction(req, "anonymous", "getLogsByLevel");

    // Responder con los logs agrupados por nivel
    res.status(200).json(groupedByLevel); 
  } catch (error) {
    console.error("Error al obtener los logs por nivel:", error);
    res.status(500).json({ error: "Error al obtener los logs por nivel" });
  }
};

exports.getLogsByResponseTime = async (req, res) => {
  try {
    const logsSnap = await db.collection('logs2').get(); // Obtener todos los logs de Firestore
    const logs = logsSnap.docs.map(doc => doc.data()); 

    // Reducir los logs para contar cuántos caen en cada intervalo de tiempo
    const responseTimeStats = logs.reduce((acc, log) => {
      const time = parseFloat(log.responseTime) || 0; // Asegúrate de que el tiempo sea un número
      const range = Math.floor(time); // Agrupar por segundos (es decir, "0", "1", "2", etc.)

      // Incrementar el contador para el rango de tiempo
      if (!acc[range]) {
        acc[range] = 0;
      }
      acc[range] += 1;
      return acc;
    }, {});

    // Registrar la acción de consulta de logs por tiempo de respuesta
    await logAction(req, "anonymous", "getLogsByResponseTime");

    // Devolver el resultado con el formato esperado
    res.status(200).json(responseTimeStats);
  } catch (error) {
    console.error("Error al obtener los logs por tiempo de respuesta:", error);
    res.status(500).json({ error: "Error al obtener los logs por tiempo de respuesta" });
  }
};

exports.getLogsByStatus = async (req, res) => {
  try {
    const logsSnap = await db.collection('logs2').get();
    const logs = logsSnap.docs.map(doc => doc.data());

    // Agrupar los logs por código de estado (status)
    const groupedByStatus = logs.reduce((acc, log) => {
      const status = log.status || "unknown";
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status] += 1;
      return acc;
    }, {});

    // Registrar la acción de consulta de logs por código de estado
    await logAction(req, "anonymous", "getLogsByStatus");

    // Responder con los logs agrupados por código de estado
    res.status(200).json(groupedByStatus);
  } catch (error) {
    console.error("Error al obtener los logs por código de estado:", error);
    res.status(500).json({ error: "Error al obtener los logs por código de estado" });
  }
};