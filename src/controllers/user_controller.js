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

    // Obtener los permisos desde el documento con ID "1"
    const roleSnap = await db.collection("roles").doc("1").get();
    if (!roleSnap.exists) {
      return res.status(500).json({ error: "No se encontraron roles en la base de datos" });
    }

    // Extraer permisos según el rol del usuario
    console.log(roleSnap)
    const roleData = roleSnap.data();
    const permissions = roleData[userData.rol] || [];

    if (permissions.length === 0) {
      return res.status(403).json({ error: "El rol del usuario no tiene permisos asignados" });
    }

    // Generar token con username, rol y permisos
    const token = jwt.sign(
      { username: userData.username, rol: userData.rol, permissions },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Expira en 1 hora
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

    // Definir permisos según el rol
    let admin_user = [];
    let common_user = [];

    if (rol === "admin_user") {
      admin_user = ["get_user", "update_user", "delete_user", "add_user"];
    } else if (rol === "common_user") {
      common_user = ["get_user", "update_user"];
    }

    // Insertar usuario en Firebase
    const newUserRef = db.collection("users").doc();
    await newUserRef.set({
      email,
      username,
      password: hashedPassword,
      rol,
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

// Eliminar un usuario por ID
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("users").doc(id).delete();
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    await db.collection("users").doc(id).update(updateData);
    res.status(200).json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// Actualizar rol de un usuario
exports.updateRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    await db.collection("users").doc(id).update({ rol });
    res.status(200).json({ message: "Rol actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar rol" });
  }
};

// Agregar un nuevo rol
exports.addRol = async (req, res) => {
  try {
    const { rol, permissions } = req.body;

    const roleRef = db.collection("roles").doc("1");
    const roleSnap = await roleRef.get();

    if (!roleSnap.exists) {
      return res.status(404).json({ error: "No se encontraron roles" });
    }

    const roleData = roleSnap.data();
    roleData[rol] = permissions;

    await roleRef.update(roleData);
    res.status(201).json({ message: "Rol agregado con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al agregar rol" });
  }
};

// Eliminar un rol
exports.deleteRol = async (req, res) => {
  try {
    const { rol } = req.params;

    const roleRef = db.collection("roles").doc("1");
    const roleSnap = await roleRef.get();

    if (!roleSnap.exists) {
      return res.status(404).json({ error: "No se encontraron roles" });
    }

    const roleData = roleSnap.data();
    delete roleData[rol];

    await roleRef.update(roleData);
    res.status(200).json({ message: "Rol eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar rol" });
  }
};

// Agregar un nuevo permiso a un rol
exports.addPermission = async (req, res) => {
  try {
    const { rol, permission } = req.body;

    const roleRef = db.collection("roles").doc("1");
    const roleSnap = await roleRef.get();

    if (!roleSnap.exists) {
      return res.status(404).json({ error: "No se encontraron roles" });
    }

    const roleData = roleSnap.data();
    if (!roleData[rol]) {
      return res.status(404).json({ error: "El rol no existe" });
    }

    roleData[rol].push(permission);
    await roleRef.update(roleData);
    res.status(201).json({ message: "Permiso agregado con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al agregar permiso" });
  }
};

// Eliminar un permiso de un rol
exports.deletePermission = async (req, res) => {
  try {
    const { rol, permission } = req.body;

    const roleRef = db.collection("roles").doc("1");
    const roleSnap = await roleRef.get();

    if (!roleSnap.exists) {
      return res.status(404).json({ error: "No se encontraron roles" });
    }

    const roleData = roleSnap.data();
    if (!roleData[rol]) {
      return res.status(404).json({ error: "El rol no existe" });
    }

    roleData[rol] = roleData[rol].filter(p => p !== permission);
    await roleRef.update(roleData);
    res.status(200).json({ message: "Permiso eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar permiso" });
  }
};