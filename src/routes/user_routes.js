const express = require("express");
const {
  login, register, getUsers, deleteUser, updateUser,
  updateRol, addRol, deleteRol,
  addPermission, deletePermission
} = require("../controllers/user_controller");  
const { verifyTokenAndPermissions } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rutas de autenticación
router.post("/login", login);
router.post("/register", register);

// Rutas protegidas con permisos
router.get("/", verifyTokenAndPermissions("get_user"), getUsers);
router.delete("/:id", verifyTokenAndPermissions("delete_user"), deleteUser);
router.put("/:id", verifyTokenAndPermissions("update_user"), updateUser);
router.put("/:id/role", verifyTokenAndPermissions("update_rol"), updateRol);

router.post("/roles", verifyTokenAndPermissions("add_rol"), addRol);
router.delete("/roles/:rol", verifyTokenAndPermissions("delete_rol"), deleteRol);

router.post("/permissions", verifyTokenAndPermissions("add_permission"), addPermission);
router.delete("/permissions", verifyTokenAndPermissions("delete_permission"), deletePermission);

module.exports = router;
