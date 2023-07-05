import bcrypt from "bcrypt";

const usuarios = [
  {
    nombre: "CRISTIAN",
    email: "cris@cris.com",
    confirmado: 1,
    password: bcrypt.hashSync("password", 10),
  },
];

export default usuarios;
