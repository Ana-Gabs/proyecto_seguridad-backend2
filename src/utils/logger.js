// ./utils/logger.js
const { db } = require("../config/firebase");

/**
 * Registra una acción en la colección "logs" de Firestore.
 * @param {Object} req - Objeto de solicitud HTTP para obtener IP y User-Agent.
 * @param {string} email - Correo del usuario relacionado con la acción.
 * @param {string} action - Acción realizada (ejemplo: "login", "register", etc.).
 */
const logAction = async (req, email, action) => {
  try {
    await db.collection("logs2").add({
      email,
      action,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "Unknown",
      referer: req.headers["referer"] || "Unknown", 
      origin: req.headers["origin"] || "Unknown",  
      method: req.method,  
      url: req.originalUrl 
    });
  } catch (error) {
    console.error("Error al registrar log:", error);
  }
};

module.exports = { logAction };
