// ./controllers/user_controller.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { db } = require("../config/firebase");
require("dotenv").config();

/***** Login del usuario *****/
exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Validar que los campos no estén vacíos
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        statusCode: 400,
        intDataMessage: [{ credentials: "Usuario y contraseña son requeridos" }],
      });
    }

    // Buscar usuario por email
    let userSnap = await db.collection("users").where("email", "==", emailOrUsername).get();

    // Si no se encontró por email, buscar por username
    if (userSnap.empty) {
      userSnap = await db.collection("users").where("username", "==", emailOrUsername).get();
    }

    // Si sigue vacío, credenciales incorrectas
    if (userSnap.empty) {
      return res.status(401).json({
        statusCode: 401,
        intDataMessage: [{ credentials: "Credenciales incorrectas" }],
      });
    }

    // Obtener los datos del usuario
    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({
        statusCode: 401,
        intDataMessage: [{ credentials: "Credenciales incorrectas" }],
      });
    }

    // Generar token con username, rol y permisos
    const token = jwt.sign(
      { username: userData.username,},
      process.env.JWT_SECRET,
      { expiresIn: "20m" } // Expira en 1 hora
    );

    // Guardar fecha de último login
    const lastLoginDate = new Date();
    await userDoc.ref.update({ last_login: lastLoginDate });

    // Enviar respuesta con token y datos del usuario
    res.status(200).json({
      statusCode: 200,
      token,
      /*user: {
        email: userData.email,
        username: userData.username,
        rol: userData.rol,
        permissions,
        last_login: lastLoginDate,
      },*/
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

/**** Registro de usuario ****/
exports.register = async (req, res) => {
  try {
    const { email, username, password, rol } = req.body;

    // Verificar si el usuario ya existe
    const userRef = db.collection("users").where("email", "==", email);
    const userSnap = await userRef.get();

    if (!userSnap.empty) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Fecha actual para registro
    const dateRegister = new Date();

    
    // Insertar usuario en Firebase
    const newUserRef = db.collection("users").doc();
    await newUserRef.set({
      email,
      username,
      password: hashedPassword,
      date_register: dateRegister,
      last_login: null,
    });

    res.status(201).json({ message: "Usuario registrado con éxito" });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

/**** Listar todos los usuarios ****/
exports.getUsers = async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ statusCode: 200, users });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};
