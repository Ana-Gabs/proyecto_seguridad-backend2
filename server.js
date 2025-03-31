// ./server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRoutes = require("./src/routes/user_routes");
const { db } = require("./src/config/firebase");
const logMiddleware = require('./src/middlewares/logMiddleware'); 

const app = express();  

// variables de entorno
const PORT = process.env.PORT;
const IP_WEBSERVICE_URL = process.env.IP_WEBSERVICE_URL;

app.use(logMiddleware);

// Middlewares
app.use(express.json());
app.use(cors());

// rutas
app.use("/users", userRoutes);

// Verificar conexión con Firestore antes de iniciar el servidor
db.listCollections()
  .then(() => {
    console.log("Conexión con Firestore establecida correctamente.");
  })
  .catch((error) => {
    console.error("Error al conectar con Firestore:", error);
  });

// arranque del servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en ${IP_WEBSERVICE_URL}:${PORT}`);
});
