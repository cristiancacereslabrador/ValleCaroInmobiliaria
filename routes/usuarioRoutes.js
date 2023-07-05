import express from "express";
import {
  formularioLogin,
  autenticar,
  cerrarSesion,
  formularioRegistro,
  registrar,
  formularioOlvidePassword,
  confirmar,
  resetPassword,
  nuevoPassword,
  comprobarToken,
} from "../controllers/usuarioController.js";

const router = express.Router();
//Routing
// router.get("/", function (req, res) {
//   res.json({ sms: "Hola Mundo en Express" });
// });
// router.post("/", function (req, res) {
//   res.json({ sms: "Respuesta tipo post" });
// });
router.get("/login", formularioLogin);
router.post("/login", autenticar);

//Cerrar sesión
router.post("/cerrar-sesion", cerrarSesion);

router.get("/registro", formularioRegistro);
router.post("/registro", registrar);

router.get("/confirmar/:token", confirmar);

router.get("/olvide-password", formularioOlvidePassword);
router.post("/olvide-password", resetPassword);
//Almacena el nuevo password
router.get("/olvide-password/:token", comprobarToken);
router.post("/olvide-password/:token", nuevoPassword);
// .post((req, res) => {
//   res.json({ sms: "Respuesta tipo post" });
// });

export default router;
