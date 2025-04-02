// ./controllers/user_controller.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const { db } = require("../config/firebase");
const { logAction } = require("../utils/logger");
require("dotenv").config();

// Obtener información del servidor y alumno
exports.getInfo = async (req, res) => {
  try {
    const randomChance = Math.random();
    if (randomChance < 0.3) {
      throw new Error("Simulación de error");
    }
    const info = {
      node_version: process.version,
      student: {
        name: "Ana Gabriela Contreras Jiménez",
        group: "Grupo IDGS11"
      }
    };
    await logAction(req, "anonymous", "getInfo");
    res.json(info);
  } catch (error) {
    console.error("Error al obtener info:", error);
    await logAction(req, "anonymous", "getInfo-error");
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Registro de usuario
exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validación de campos vacíos
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    // Validación del formato del email
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      return res.status(400).json({ error: "Email inválido." });
    }

    // Verificar si el email ya existe en la base de datos
    const userSnap = await db.collection("users").where("email", "==", email).get();
    if (!userSnap.empty) {
      return res.status(400).json({ error: "El usuario ya existe." });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar el secreto para MFA
    const secret = speakeasy.generateSecret();

    // Crear el nuevo usuario en la base de datos
    await db.collection("users").doc().set({
      email,
      username,
      password: hashedPassword,
      mfa_secret: secret.base32,
      date_register: new Date(),
      last_login: null
    });

    // Registrar la acción en los logs, usando el email proporcionado
    await logAction(req, email, "register");

    // Responder con éxito
    res.status(201).json({ message: "Usuario registrado con éxito.", mfa_secret: secret.otpauth_url });

  } catch (error) {
    console.error("Error en el registro:", error);  // Log detallado en consola
    res.status(500).json({ error: "Error en el registro." });  // Mensaje genérico para el cliente
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

    await logAction(req, userData.email, "login");

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el login." });
  }
};

// Verificar OTP
exports.verifyOtp = async (req, res) => {
  try {
    //console.log("Datos recibidos en verifyOtp:", req.body);

    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ message: "Faltan datos en la solicitud" });
    }

    const userSnap = await db.collection("users").where("email", "==", email).get();

    if (userSnap.empty) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const userData = userSnap.docs[0].data();
    //console.log("Datos del usuario en la BD:", userData);

    if (!userData.mfa_secret) {
      return res.status(400).json({ message: "El usuario no tiene 2FA habilitado" });
    }

    //console.log("mfa_secret del usuario:", userData.mfa_secret);

    const isVerified = speakeasy.totp.verify({
      secret: userData.mfa_secret,
      encoding: "base32",
      token,
      window: 1
    });

    if (!isVerified) {
      console.log("Código OTP inválido");
      return res.status(401).json({ success: false, message: "Código OTP inválido o expirado" });
    }

    //console.log("OTP verificado correctamente");

    const jwtToken = jwt.sign({ email: userData.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    //console.log("JWT generado:", jwtToken);

    res.json({ success: true, token: jwtToken });
  } catch (error) {
    console.error("Error al verificar OTP:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};