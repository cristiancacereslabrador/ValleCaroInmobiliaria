(function () {
  // const lat = 20.67444163271174;
  const lat = 7.749776825746999;
  // const lng = -103.38739216304566;
  const lng = -72.22933727871077;
  const mapa = L.map("mapa").setView([lat, lng], 16);
  let marker;
  // Utilizar Provider y Geocoder
  const geocodeService = L.esri.Geocoding.geocodeService();

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapa);
  // El pin
  marker = new L.marker([lat, lng], {
    draggable: true,
    autoPan: true,
  }).addTo(mapa);
  // Detectar el movimiento del pin
  marker.on("moveend", function (e) {
    marker = e.target;
    // console.log("marker", marker);
    const posicion = marker.getLatLng();
    console.log("posicion", posicion);
    mapa.panTo(new L.LatLng(posicion.lat, posicion.lng));
    // Obtener la informacion de las calles al soltar el pin
    geocodeService
      .reverse()
      .latlng(posicion, 13)
      .run(function (error, resultado) {
        console.log("resultado", resultado);
        const latitud = posicion.lat;
        const longitud = posicion.lng;
        obtenerDireccion(latitud, longitud)
          .then((direccion) => {
            marker.bindPopup(direccion).openPopup();
            console.log("direccion completa", direccion);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      });
  });
})();

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
