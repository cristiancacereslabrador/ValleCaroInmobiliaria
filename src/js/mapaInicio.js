(function () {
  //Logical OR
  const lat = 7.749776825746999;
  // const lat = document.querySelector("#lat").value || 7.749776825746999;
  const lng = -72.22933727871077;
  // const lng = document.querySelector("#lng").value || -72.22933727871077;
  const mapa = L.map("mapa-inicio").setView([lat, lng], 16);

  let markers = new L.FeatureGroup().addTo(mapa);
  console.log("markers", markers);
  let propiedades = [];
  //Filtros
  const filtros = {
    categoria: "",
    precio: "",
  };

  const categoriasSelect = document.querySelector("#categorias");
  const preciosSelect = document.querySelector("#precios");

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapa);
  //Filtrado de Categorías y Precios
  // console.log("typeof e.target.value", typeof e.target.value);
  // console.log("e.target.value", +e.target.value);
  categoriasSelect.addEventListener("change", (e) => {
    filtros.categoria = +e.target.value;
    filtrarPropiedades();
  });
  preciosSelect.addEventListener("change", (e) => {
    filtros.precio = +e.target.value;
    filtrarPropiedades();
  });

  const obtenerPropiedades = async () => {
    try {
      const url = "/api/propiedades";
      const respuesta = await fetch(url);
      propiedades = await respuesta.json();
      // console.log("propiedades", propiedades);
      mostrarPropiedades(propiedades);
    } catch (error) {
      console.log("error", error);
    }
  };

  const mostrarPropiedades = (propiedades) => {
    //Limpiar los market previos
    markers.clearLayers();

    propiedades.forEach((propiedad) => {
      // console.log("propiedad", propiedad);
      //Agregar los pines
      const marker = new L.marker([propiedad?.lat, propiedad?.lng], {
        autoPan: true,
      }).addTo(mapa).bindPopup(`
        <p class="text-purple-600 font-bold">${propiedad.categoria.nombre}</p>
          <h1 class="text-xl font-extrabold uppercase my-2">${propiedad?.titulo}</h1>
          <img class="rounded-lg" src="/uploads/${propiedad?.imagen}" alt="Imagen de la propiedad ${propiedad.titulo}">
          <p class="text-gray-600 font-bold">${propiedad.precio.nombre}</p>
          <a href="/propiedad/${propiedad.id}" class="bg-purple-600 block p-2 text-center font-bold uppercase rounded-lg">Ver propiedad</a>
                   
          `);
      markers.addLayer(marker);
    });
  };

  const filtrarPropiedades = () => {
    // console.log("propiedades", propiedades);
    const resultado = propiedades
      .filter(filtrarCategoria)
      .filter(filtrarPrecio);
    console.log("resultado", resultado);
    mostrarPropiedades(resultado);
  };

  const filtrarCategoria = (propiedad) =>
    filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad;

  const filtrarPrecio = (propiedad) =>
    filtros.precio ? propiedad.precioId === filtros.precio : propiedad;

  // const filtrarPropiedades = () => {
  //   const resultado = propiedades
  //     .filter(filtrarCategoria)
  //     .filter(filtrarPrecio);
  //   mostrarPropiedades(resultado);
  // };

  // const filtrarCategoria = (propiedad) =>
  //   filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad;

  // const filtrarPrecio = (propiedad) =>
  //   filtros.precio ? propiedad.precioId === filtros.precio : propiedad;

  obtenerPropiedades();
})();
