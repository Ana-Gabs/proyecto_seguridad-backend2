// ./controllers/logsss_controller.js
const { db } = require('../config/firebase');


exports.getLogsServer1 = async (req, res) => {
  try {
    const logsSnap = await db.collection('logs').get();
    const logs = logsSnap.docs.map(doc => doc.data());
    res.status(200).json(logs);
  } catch (error) {
    console.error("Error al obtener logs del Servidor 1:", error);
    res.status(500).json({ error: "Error al obtener los logs del Servidor 1" });
  }
};

exports.getLogsServer2 = async (req, res) => {
  try {
    const logsSnap = await db.collection('logs2').get();
    const logs = logsSnap.docs.map(doc => doc.data());
    res.status(200).json(logs);
  } catch (error) {
    console.error("Error al obtener logs del Servidor 2:", error);
    res.status(500).json({ error: "Error al obtener los logs del Servidor 2" });
  }
};
