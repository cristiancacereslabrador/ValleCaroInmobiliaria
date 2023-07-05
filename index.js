// const express = require("express"); //Common JS
import express from "express";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import propiedadesRoutes from "./routes/propiedadesRoutes.js";
import appRoutes from "./routes/appRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import db from "./config/db.js";
import csurf from "csurf";
import cookieParser from "cookie-parser";

//Crear la app
const app = express();
//Habilitar lectura de campos de formulario
app.use(express.urlencoded({ extended: true }));
//Habilitar Cookie Parser
app.use(cookieParser());
//Habilitar CSRF
app.use(csurf({ cookie: true }));

//Conexion a la base de datos
try {
  await db.authenticate();
  db.sync();
  console.log("Conexión correcta a la base de datos");
} catch (error) {
  console.log("error", error);
}
//Habilitar PUG
app.set("view engine", "pug");
app.set("views", "./views");

//Routing
app.use("/", appRoutes);
app.use("/auth", usuarioRoutes);
app.use("/", propiedadesRoutes);
app.use("/api", apiRoutes);

//Carpeta Publica
app.use(express.static("public"));
//Definir un puerto y arrancar el proyecto
const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`Servidor funcionando en el puerto: ${port}`)
);
