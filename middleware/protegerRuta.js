import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const protegerRuta = async (req, res, next) => {
  // console.log("Desde el middleware");
  //Verificar si hay un token
  // console.log("req.cookies._token:", req.cookies._token);
  const { _token } = req.cookies;
  if (!_token) {
    return res.redirect("/auth/login");
  }
  //Comprobar el token
  try {
    const decoded = jwt.verify(_token, process.env.JWT_SECRET);
    // console.log("decoded", decoded);
    const usuario = await Usuario.scope("eliminarPassword").findByPk(
      decoded.id
    );
    // console.log("usuariooooo", usuario);
    //Almacenar usuario al Req
    if (usuario) {
      req.usuario = usuario;
    } else {
      return res.redirect("/auth/login");
    }
    return next();
  } catch (error) {
    return res.clearCookie("_token").redirect("/auth/login");
  }
  // next();
};

export default protegerRuta;
