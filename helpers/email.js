import nodemailer from "nodemailer";

const emailRegistro = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("datos:", datos);
  const { email, nombre, token } = datos;
  //Enviar el email
  await transport.sendMail({
    from: "ValleCaroInmobiliaria",
    to: email,
    subject: "Confirma tu cuenta en ValleCaroInmobiliaria",
    text: "Confirma tu cuenta en ValleCaroInmobiliaria",
    html: `<p>Hola ${nombre}, comprueba tu cuenta en ValleCaroInmobiliaria.</p>
    <p>Tu cuenta ya esta lista, solo debes confirmarla en el siguiente enlace:
    <a href="${process.env.BACKEND_URL}:${
      process.env.PORT ?? 3000
    }/auth/confirmar/${token}">Confirmar Cuenta</a>
    </p>
    <p>Si no creaste esta cuenta, puedes ignorar el mensaje.</p>
    `,
  });
};
const emailOlvidePassword = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("datos:", datos);
  const { email, nombre, token } = datos;
  //Enviar el email
  await transport.sendMail({
    from: "ValleCaroInmobiliaria",
    to: email,
    subject: "Reestablece tu Password en ValleCaroInmobiliaria",
    text: "Reestablece tu Password en ValleCaroInmobiliaria",
    html: `<p>Hola ${nombre}, has solicitado reestablecer tu Password en ValleCaroInmobiliaria.</p>
    <p>Sigue el siguiente enlace para generar un Password nuevo:
    <a href="${process.env.BACKEND_URL}:${
      process.env.PORT ?? 3000
    }/auth/olvide-password/${token}">Reestablecer Password</a>
    </p>
    <p>Si tu no solocitaste el cambio de Password, puedes ignorar el mensaje.</p>
    `,
  });
};

export { emailRegistro, emailOlvidePassword };
//USUARIOS
//cristianvianey@gmail.com  123456  usuario sin propiedades
// cris@cris.com password usuario con todas las propiedades
