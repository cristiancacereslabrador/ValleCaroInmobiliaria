import { check, validationResult } from "express-validator";
import Usuario from "../models/Usuario.js";
import { generarJWT, generarId } from "../helpers/tokens.js";
import { emailOlvidePassword, emailRegistro } from "../helpers/email.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const formularioLogin = (req, res) => {
  res.render("auth/login", {
    pagina: "Iniciar Sesión",
    csrfToken: req.csrfToken(),
  });
};

const autenticar = async (req, res) => {
  // console.log("autenticando ando");
  //Validacion
  await check("email")
    .isEmail()
    .withMessage("El email es obligatorio")
    .run(req);
  await check("password")
    .notEmpty()
    .withMessage("El password es obligatorio")
    .run(req);

  let resultado = validationResult(req);
  // return res.json(resultado.array());
  //Verificar q el resultado este vacío
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }
  const { email, password } = req.body;

  //Comprobar si el usuario existe
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El usuario no existe" }],
    });
  }
  //Comprobar si el usuario esta confirmado
  if (!usuario.confirmado) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "Tu cuenta no ha sido confirmada" }],
    });
  }
  //Resivar el password
  if (!usuario.verificarPassword(password)) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El password es incorrecto" }],
    });
  }
  //Autenticaral usuario

  const token = generarJWT({ id: usuario.id, nombre: usuario.nombre });

  // console.log("token:", token);
  //Almacenar token en un cookie
  return res
    .cookie("_token", token, {
      httpOnly: true,
      //secure: true // para que requiera certificado SSL
    })
    .redirect("/mis-propiedades");
};

const cerrarSesion = (req, res) => {
  // res.send("Cerrando Sesión");
  return res.clearCookie("_token").status(200).redirect("/auth/login");
};

const formularioRegistro = (req, res) => {
  console.log("req.csrfToken()", req.csrfToken());

  res.render("auth/registro", {
    pagina: "Crear Cuenta",
    csrfToken: req.csrfToken(),
  });
};
const registrar = async (req, res) => {
  //Validación
  await check("nombre")
    .notEmpty()
    .withMessage("El nombre no puede ir vacío")
    .run(req);
  await check("email").isEmail().withMessage("Eso no parece un email").run(req);
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El password debe ser de al menos 6 caracteres")
    .run(req);
  await check("repetir_password")
    .equals(req.body.password)
    .withMessage("Los passwords no son iguales")
    .run(req);

  let resultado = validationResult(req);

  // return res.json(resultado.array());
  //Verificar q el resultado este vacío
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/registro", {
      pagina: "Crear Cuenta",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
      },
    });
  }
  console.log("request", req.body);
  // res.json(resultado.array());

  //Extraer los datos
  const { nombre, email, password } = req.body;
  //Verificar que el usuario no este duplicado
  const existeUsuario = await Usuario.findOne({
    where: { email },
  });
  if (existeUsuario) {
    return res.render("auth/registro", {
      pagina: "Crear Cuenta",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El usuario ya esta registrado" }],
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
      },
    });
  }
  // console.log("existeUsuario", existeUsuario);
  // return;

  // const usuario = await Usuario.create(req.body);
  // res.json(usuario);
  //Almacenar un usuario
  const usuario = await Usuario.create({
    nombre,
    email,
    password,
    token: generarId(),
  });

  //Envia email de confirmacion
  emailRegistro({
    nombre: usuario.nombre,
    email: usuario.email,
    token: usuario.token,
  });
  //Mostrar mensaje de confirmacion
  res.render("templates/mensaje", {
    pagina: "Cuenta Creada Correctamente",
    mensaje: "Hemos Enviado un Email de Confirmación, presiona en el enlace",
  });
};
//Funcion que comprueba una cuenta
const confirmar = async (req, res) => {
  const { token } = req.params;
  // console.log("confirmando", token);
  //Verificar si el token es válido
  const usuario = await Usuario.findOne({ where: { token } });

  // console.log("usuario:", usuario);
  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Error al confirmar tu cuenta",
      mensaje: "Hubo un error al confirmar tu cuenta intenta de nuevo",
      error: true,
    });
  }
  //Confirmar la cuenta
  usuario.token = null;
  usuario.confirmado = true;
  await usuario.save();
  res.render("auth/confirmar-cuenta", {
    pagina: "Cuenta Confirmada",
    mensaje: "La cuenta se confirmó correctamente",
  });
  // console.log("usuario", usuario);
  // console.log("usuario.token", usuario.token);
};

const formularioOlvidePassword = (req, res) => {
  res.render("auth/olvide-password", {
    pagina: "Recupera tu acceso",
    csrfToken: req.csrfToken(),
  });
};

const resetPassword = async (req, res) => {
  //Validacion
  await check("email").isEmail().withMessage("Eso no parece un email").run(req);

  let resultado = validationResult(req);

  // return res.json(resultado.array());
  //Verificar q el resultado este vacío
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/olvide-password", {
      pagina: "Recupera tu acceso a ValleCaro Inmobiliaria",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }
  //Buscar el usuario
  const { email } = req.body;
  const usuario = await Usuario.findOne({ where: { email } });

  // console.log("usuario", usuario);
  if (!usuario) {
    return res.render("auth/olvide-password", {
      pagina: "Recupera tu acceso a ValleCaro Inmobiliaria",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El email no pertenece a ningun usuario" }],
    });
  }
  //Generar un token y enviar en email
  usuario.token = generarId();
  await usuario.save();
  //Enviar un email para
  emailOlvidePassword({
    email: usuario.email,
    nombre: usuario.nombre,
    token: usuario.token,
  });
  //Renderizar un mensaje
  res.render("templates/mensaje", {
    pagina: "Reestablece tu Password",
    mensaje: "Hemos Enviado un Email con las instrucciones.",
  });
};
const comprobarToken = async (req, res) => {
  const { token } = req.params;
  const usuario = await Usuario.findOne({ where: { token } });
  console.log("usuario", usuario);
  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Reestablece tu password",
      csrfToken: req.csrfToken(),
      mensaje: "Hubo un error al validar tu informacion, intenta de nuevo",
      error: true,
    });
  }
  //Mostrar formulario para modificar el password
  res.render("auth/reset-password", {
    pagina: "Reestablece tu Password",
    csrfToken: req.csrfToken(),
    // mensaje: "que ha pasaoooo?",
    // error: true,
  });
};
const nuevoPassword = async (req, res) => {
  // console.log("guardando password");
  //Validar el password
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El password debe ser de al menos 6 caracteres")
    .run(req);
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/reset-password", {
      pagina: "Reestablece tu Password",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }
  const { token } = req.params;
  const { password } = req.body;
  //Identificar quien hace el cambio
  const usuario = await Usuario.findOne({ where: { token } });
  // console.log("usuario", usuario);
  //Hashear el nuevo password
  const salt = await bcrypt.genSalt(10);
  usuario.password = await bcrypt.hash(password, salt);
  usuario.token = null;
  await usuario.save();
  res.render("auth/confirmar-cuenta", {
    pagina: "Password Reestablecido",
    mensaje: "El password se guardo correctamente",
  });
};

export {
  formularioLogin,
  autenticar,
  cerrarSesion,
  formularioRegistro,
  formularioOlvidePassword,
  registrar,
  confirmar,
  resetPassword,
  comprobarToken,
  nuevoPassword,
};
