(function () {
  // const lat = 20.67444163271174;
  const lat = 7.749776825746999;
  // const lng = -103.38739216304566;
  const lng = -72.22933727871077;
  const mapa = L.map("mapa").setView([lat, lng], 16);
  let marker;
  //Utilizar Provider y Geocoder
  const geocodeService = L.esri.Geocoding.geocodeService();

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapa);
  //El pin
  marker = new L.marker([lat, lng], {
    draggable: true,
    autoPan: true,
  }).addTo(mapa);
  //Detectar el movimiento del pin
  marker.on("moveend", function (e) {
    marker = e.target;
    // console.log("marker", marker);
    const posicion = marker.getLatLng();
    console.log("posicion", posicion);
    mapa.panTo(new L.LatLng(posicion.lat, posicion.lng));
    //Obtener la informacion de las calles al soltar el pin
    geocodeService
      .reverse()
      .latlng(posicion, 13)
      .run(function (error, resultado) {
        console.log("resultado", resultado);
        marker.bindPopup(resultado.address.LongLabel);
      });
  });
})();
