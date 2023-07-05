import { unlink } from "node:fs/promises";
import { validationResult } from "express-validator";
import {
  Precio,
  Categoria,
  Propiedad,
  Mensaje,
  Usuario,
} from "../models/index.js";
import { esVendedor, formatearFecha } from "../helpers/index.js";

const admin = async (req, res) => {
  //Leer QueryString
  // console.log(req.query.pagina);
  const { pagina: paginaActual } = req.query;
  // console.log(paginaActual);

  const expresion = /^[1-9]$/;

  if (!expresion.test(paginaActual)) {
    return res.redirect("/mis-propiedades?pagina=1");
  }
  try {
    const { id } = req.usuario;
    // console.log("id:", id);
    //Limites y Offset para el paginador
    const limit = 10;
    const offset = paginaActual * limit - limit;

    const [propiedades, total] = await Promise.all([
      Propiedad.findAll({
        limit,
        offset,
        where: { usuarioId: id },
        include: [
          { model: Categoria, as: "categoria" },
          { model: Precio, as: "precio" },
          { model: Mensaje, as: "mensajes" },
        ],
      }),
      Propiedad.count({
        where: { usuarioId: id },
      }),
    ]);

    // console.log("total", total);

    res.render("propiedades/admin", {
      pagina: "Mis propiedades",
      // barra: true,
      propiedades,
      csrfToken: req.csrfToken(),
      paginas: Math.ceil(total / limit),
      paginaActual: Number(paginaActual),
      total,
      offset,
      limit,
    });
    // res.send("Mis propiedades");
  } catch (error) {
    console.log("error", error);
  }
};
//Formulario para crear nuevao propiedad
const crear = async (req, res) => {
  //Consultar Modelo de Precio y Categoria
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);

  res.render("propiedades/crear", {
    pagina: "Crear propiedad",
    // barra: true,
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: {},
  });
};

const guardar = async (req, res) => {
  //Validacion
  let resultado = validationResult(req, res);
  if (!resultado.isEmpty()) {
    //Consultar Modelo de Precio y Categoria
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);
    res.render("propiedades/crear", {
      pagina: "Crear propiedad",
      // barra: true,
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body,
    });
  }
  //Crear un registro
  console.log("req.body", req.body); //objeto con los datos ingresados en el formulario
  const {
    titulo,
    descripcion,
    tamano,
    habitaciones,
    estacionamiento,
    wc,
    calle,
    lat,
    lng,
    precio: precioId,
    categoria: categoriaId,
  } = req.body;

  // console.log("req.usuario", req.usuario);
  const { id: usuarioId } = req.usuario;

  try {
    const propiedadGuardada = await Propiedad.create({
      titulo,
      descripcion,
      tamano,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioId,
      categoriaId,
      usuarioId,
      imagen: "",
    });

    const { id } = propiedadGuardada;
    res.redirect(`/propiedades/agregar-imagen/${id}`);
  } catch (error) {
    console.log("error", error);
  }
};

const agregarImagen = async (req, res) => {
  const { id } = req.params;
  //Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);
  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar que la propiedad no este publicada
  if (propiedad.publicado) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad pertenece a quien visita esta página
  // console.log("req.usuario desde PROPIEDAD CONTROLLER", req.usuario);
  // console.log(req.usuario.id == propiedad.usuarioId);
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect("/mis-propiedades");
  }
  // console.log(
  //   "req.usuario.id desde PROPIEDAD CONTROLLER",
  //   typeof req.usuario.id.toString()
  // );
  // console.log(
  //   "propiedad.usuarioId desde PROPIEDAD CONTROLLER",
  //   typeof propiedad.usuarioId.toString()
  // );

  // console.log("agregando imagen");
  res.render("propiedades/agregar-imagen", {
    pagina: `Agregar Imagen: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    propiedad,
  });
};

const alamcenarImagen = async (req, res, next) => {
  const { id } = req.params;
  //Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);
  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar que la propiedad no este publicada
  if (propiedad.publicado) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad pertenece a quien visita esta página
  // console.log("req.usuario desde PROPIEDAD CONTROLLER", req.usuario);
  // console.log(req.usuario.id == propiedad.usuarioId);
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect("/mis-propiedades");
  }

  try {
    console.log(req.file);
    //Almacenar la imagen y publicar propiedad
    propiedad.imagen = req.file.filename;
    propiedad.publicado = 1;
    await propiedad.save();

    // res.redirect("/mis-propiedades");
    next();
  } catch (error) {
    console.log("error", error);
  }
};

const editar = async (req, res) => {
  const { id } = req.params;

  //Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Revisar que quien visita la URL es quien creo la propiedad
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Consultar Modelo de Precio y Categoria
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);

  res.render("propiedades/editar", {
    pagina: `Editar Propiedad: ${propiedad.titulo}`,
    // barra: true,
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: propiedad,
  });
};

const guardarCambios = async (req, res) => {
  // console.log("guardandoCambios");
  //Verificar la validacion
  let resultado = validationResult(req, res);
  if (!resultado.isEmpty()) {
    //Consultar Modelo de Precio y Categoria
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);
    res.render("propiedades/editar", {
      pagina: "Editar propiedad",
      // barra: true,
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body,
    });
  }

  const { id } = req.params;

  //Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Revisar que quien visita la URL es quien creo la propiedad
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Reeescribir el objeto y actualizar
  try {
    // console.log("propiedad", propiedad);
    const {
      titulo,
      descripcion,
      tamano,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precio: precioId,
      categoria: categoriaId,
    } = req.body;

    propiedad.set({
      titulo,
      descripcion,
      tamano,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioId,
      categoriaId,
    });
    // propiedad = req.body;
    await propiedad.save();
    res.redirect("/mis-propiedades");
  } catch (error) {
    console.log("error", error);
  }
};

const eliminar = async (req, res) => {
  // console.log("eliminando");
  const { id } = req.params;

  //Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Revisar que quien visita la URL es quien creo la propiedad
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Eliminar la imagen asociada
  await unlink(`public/uploads/${propiedad.imagen}`);
  console.log(`se elimino la imagen ${propiedad.imagen}`);
  //Eliminar la propiedad
  await propiedad.destroy();
  res.redirect("/mis-propiedades");
};
//Modificar el estado de la propiedad
const cambiarEstado = async (req, res) => {
  // console.log("cambiando estado...");
  const { id } = req.params;

  //Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Revisar que quien visita la URL es quien creo la propiedad
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  // console.log("propiedad", propiedad);
  //Actualizar
  propiedad.publicado = !propiedad.publicado;

  await propiedad.save();

  res.json({ resultado: "ok" });
};

//Mostrar propiedad
const mostrarPropiedad = async (req, res) => {
  const { id } = req.params;

  console.log("req.usuario", req.usuario);

  //Comprobar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {
        model: Precio,
        as: "precio",
      },
      { model: Categoria, as: "categoria" },
    ],
  });
  if (!propiedad || !propiedad.publicado) {
    return res.redirect("/404");
  }
  // res.send("mostrando");

  // console.log("esVendedor", esVendedor(req.usuario?.id, propiedad.usuarioId));

  res.render("propiedades/mostrar", {
    propiedad,
    pagina: propiedad.titulo,
    csrfToken: req.csrfToken(),
    usuario: req.usuario,
    esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
  });
};

const enviarMensaje = async (req, res) => {
  const { id } = req.params;
  // console.log("req.usuario", req.usuario);
  //Comprobar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {
        model: Precio,
        as: "precio",
      },
      { model: Categoria, as: "categoria" },
    ],
  });
  if (!propiedad) {
    return res.redirect("/404");
  }
  // res.send("mostrando");
  // console.log("esVendedor", esVendedor(req.usuario?.id, propiedad.usuarioId));
  //Renderizar los errores en caso de tenerlos
  //Validacion
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    return res.render("propiedades/mostrar", {
      propiedad,
      pagina: propiedad.titulo,
      csrfToken: req.csrfToken(),
      usuario: req.usuario,
      esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
      errores: resultado.array(),
    });
  }
  // console.log("req.body", req.body);
  // console.log("req.params", req.params);
  // console.log("req.usuario", req.usuario);

  const { mensaje } = req.body;
  const { id: propiedadId } = req.params;
  const { id: usuarioId } = req.usuario;

  // return;
  //Almacenar el mensaje
  await Mensaje.create({ mensaje, propiedadId, usuarioId });

  res.redirect("/");

  // res.render("propiedades/mostrar", {
  //   propiedad,
  //   pagina: propiedad.titulo,
  //   csrfToken: req.csrfToken(),
  //   usuario: req.usuario,
  //   esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
  //   enviado: true,
  // });
};
//Leer mensajes
const verMensajes = async (req, res) => {
  const { id } = req.params;

  //Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {
        model: Mensaje,
        as: "mensajes",
        include: [{ model: Usuario.scope("eliminarPassword"), as: "usuario" }],
      },
    ],
  });

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Revisar que quien visita la URL es quien creo la propiedad
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }

  // res.send("Mensajes aqui");
  res.render("propiedades/mensajes", {
    pagina: "Mensajes",
    mensajes: propiedad.mensajes,
    formatearFecha,
  });
};

export {
  admin,
  crear,
  guardar,
  agregarImagen,
  alamcenarImagen,
  editar,
  guardarCambios,
  eliminar,
  cambiarEstado,
  mostrarPropiedad,
  enviarMensaje,
  verMensajes,
};
