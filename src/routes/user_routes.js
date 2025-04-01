// ./routes/user_routes.js
const express = require("express");
const { login, register, getInfo, verifyOtp } = require("../controllers/user_controller");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

// Rutas de autenticación
router.post("/login", login);
router.post("/register", register);
router.get("/info", getInfo);
//router.get("/info", verifyToken, getInfo);
router.post("/verify-otp", verifyOtp);


module.exports = router;


