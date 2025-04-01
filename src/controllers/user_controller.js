// ./controllers/user_controller.js
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const { db } = require("../config/firebase");
require("dotenv").config();

// Rate Limit: 100 requests cada 10 minutos
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100,
  message: "Demasiadas peticiones, intenta más tarde."
});

// Obtener información del servidor y alumno
exports.getInfo = (req, res) => {
  res.json({
    node_version: process.version,
    student: {
      name: "Ana Gabriela Contreras Jiménez",
      group: "Grupo IDGS11"
    }
  });
};

// Registro de usuario
exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      return res.status(400).json({ error: "Email inválido." });
    }
    
    const userSnap = await db.collection("users").where("email", "==", email).get();
    if (!userSnap.empty) {
      return res.status(400).json({ error: "El usuario ya existe." });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const secret = speakeasy.generateSecret();
    await db.collection("users").doc().set({
      email,
      username,
      password: hashedPassword,
      mfa_secret: secret.base32,
      date_register: new Date(),
      last_login: null
    });
    
    res.status(201).json({ message: "Usuario registrado con éxito.", mfa_secret: secret.otpauth_url });
  } catch (error) {
    res.status(500).json({ error: "Error en el registro." });
  }
};

// Login con MFA
exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    let userSnap = await db.collection("users").where("email", "==", emailOrUsername).get();
    if (userSnap.empty) {
      userSnap = await db.collection("users").where("username", "==", emailOrUsername).get();
    }
    if (userSnap.empty) return res.status(401).json({ error: "Credenciales incorrectas." });
    
    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();
    if (!await bcrypt.compare(password, userData.password)) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }
    
    if (userData.mfaEnabled) {
      return res.json({ requiresMFA: true, email: userData.email });
    }
    
    const token = jwt.sign({ email: userData.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    await userDoc.ref.update({ last_login: new Date() });
    await db.collection("logs").add({
      email: userData.email,
      action: "login",
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el login." });
  }
};

// Verificar OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, token } = req.body;
    const userSnap = await db.collection("users").where("email", "==", email).get();
    if (userSnap.empty) return res.status(401).json({ message: "Usuario no encontrado" });
    
    const userData = userSnap.docs[0].data();
    if (!userData.mfaEnabled) {
      return res.status(400).json({ message: "El usuario no tiene 2FA habilitado" });
    }
    const isVerified = speakeasy.totp.verify({
      secret: userData.mfa_secret,
      encoding: "base32",
      token,
      window: 1
    });
    if (!isVerified) return res.status(401).json({ success: false, message: "Código OTP inválido o expirado" });

    const jwtToken = jwt.sign({ email: userData.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    await db.collection("logs").add({
      email: userData.email,
      action: "verify-otp",
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });
    res.json({ success: true, token: jwtToken });
  } catch (error) {
    console.error("Error al verificar OTP:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
