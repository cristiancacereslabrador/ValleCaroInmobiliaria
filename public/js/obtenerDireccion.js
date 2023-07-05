const fetch = require("node-fetch");

async function obtenerDireccion(latitud, longitud) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitud}&lon=${longitud}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const direccion = data.display_name;
    return direccion;
  } catch (error) {
    console.error("Error al obtener la dirección:", error);
    return null;
  }
}

// Ejemplo de uso
const latitud = 7.749543192642699;
const longitud = -72.22910508515142;

obtenerDireccion(latitud, longitud)
  .then((direccion) => {
    console.log("Dirección:", direccion);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
