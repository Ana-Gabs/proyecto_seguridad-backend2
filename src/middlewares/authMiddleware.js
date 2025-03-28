// ./middleware/authMiddlewarejs
const jwt = require("jsonwebtoken");

exports.verifyTokenAndPermissions = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Token no proporcionado" });
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Verificar si el usuario tiene el permiso requerido
      if (!req.user.permissions.includes(requiredPermission)) {
        return res.status(403).json({ error: "No tienes permiso para esta acción" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }
  };
};


