const { db } = require("../config/firebase");
const os = require("os");

/**
 * Registra una acción en la colección "logs" de Firestore.
 * @param {Object} req - Objeto de solicitud HTTP para obtener IP y User-Agent.
 * @param {Object} res - Objeto de respuesta HTTP para obtener el código de estado y el tiempo de respuesta.
 * @param {string} email - Correo del usuario relacionado con la acción.
 * @param {string} action - Acción realizada (ejemplo: "login", "register", etc.).
 * @param {string} logLevel - Nivel de log ("info", "warn", "error").
 */
const logAction = async (req, res, email, action, logLevel = "info") => {
  try {
    const startTime = process.hrtime(); // Inicia el temporizador

    // Usa el evento "finish" para calcular el tiempo de respuesta después de que se haya procesado la solicitud.
    res.on('finish', async () => {
      const diff = process.hrtime(startTime); // Obtiene el tiempo transcurrido
      const responseTime = diff[0] * 1e3 + diff[1] * 1e-6; // Convierte a ms

      // Determina el nivel de log basado en el código de estado
      const statusCode = res.statusCode || 500; // Si no se encuentra el código, asumimos 500 como predeterminado
      const dynamicLogLevel = statusCode >= 400 ? "error" : "info"; // Si el código es >= 400, es un error

      // Aquí agregamos los logs a Firestore con todos los detalles adicionales.
      await db.collection("logs2").add({
        email,
        action,
        logLevel: logLevel || dynamicLogLevel,  // Nivel de log
        timestamp: new Date(),
        ip: req.ip || "Unknown",  // Dirección IP del cliente
        userAgent: req.headers["user-agent"] || "Unknown", // Información sobre el navegador del cliente
        referer: req.headers["referer"] || "Unknown",  // Referer de la solicitud (si existe)
        origin: req.headers["origin"] || "Unknown",  // Origen de la solicitud (si existe)
        method: req.method,  // Método HTTP (GET, POST, etc.)
        url: req.originalUrl,  // URL solicitada
        status: statusCode,  // Código de estado de la respuesta HTTP
        responseTime: responseTime.toFixed(2),  // Tiempo de respuesta en milisegundos
        protocol: req.protocol || "Unknown",  // Protocolo usado (http/https)
        hostname: os.hostname(),  // Nombre del servidor
        environment: process.env.NODE_ENV || "development",  // Entorno en el que se ejecuta el servidor
        nodeVersion: process.version,  // Versión de Node.js
        pid: process.pid  // ID del proceso
      });
    });
  } catch (error) {
    console.error("Error al registrar log:", error);
  }
};

module.exports = { logAction };