// ./middleware/authMiddlewarejs
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token || !token.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Token inválido" });
  }
  
  const tokenValue = token.split(" ")[1];
  jwt.verify(tokenValue, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido o expirado" });
    
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
