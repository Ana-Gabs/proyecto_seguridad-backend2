const express = require("express");
const {
  login, register, getUsers, 
} = require("../controllers/user_controller");  

const router = express.Router();

// Rutas de autenticación
router.post("/login", login);
router.post("/register", register);

module.exports = router;
