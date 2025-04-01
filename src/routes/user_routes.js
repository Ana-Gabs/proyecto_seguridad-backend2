// ./routes/user_routes.js
const express = require("express");
const { getInfo, register, login, verifyOtp } = require("../controllers/user_controller");  

const router = express.Router();

// Rutas de autenticación
router.get("/getInfo", getInfo);
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

module.exports = router;

