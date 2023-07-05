(function () {
  //Logical OR
  // const lat = 7.749776825746999;
  const lat = document.querySelector("#lat").value || 7.749776825746999;
  // const lng = -72.22933727871077;
  const lng = document.querySelector("#lng").value || -72.22933727871077;

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
    // Obtener la información de las calles al soltar el pin
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${posicion.lat}&lon=${posicion.lng}`;

    fetch(nominatimUrl)
      .then((response) => response.json())
      .then((nominatimData) => {
        const direccionNominatim =
          nominatimData?.display_name || "Dirección no disponible";
        const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${posicion.lat},${posicion.lng}`;
        const popupContent = `
          <strong>Dirección obtenida:</strong> <a href="${googleMapsLink}" target="_blank" rel="noopener noreferrer">${direccionNominatim}</a><br>
          <span style="font-size: 12px;">Haz click para ver el mapa en Google Maps</span>
        `;
        marker.bindPopup(popupContent).openPopup();
        console.log("direccionNominatim", direccionNominatim);
        //LLenar los campos
        document.querySelector(".calle").textContent = direccionNominatim ?? "";
        document.querySelector("#calle").value = direccionNominatim ?? "";
        document.querySelector("#lat").value = posicion.lat ?? "";
        document.querySelector("#lng").value = posicion.lng ?? "";
      })
      .catch((error) => {
        console.error("Error:", error);
        const popupContent = `Error al obtener la dirección`;
        marker.bindPopup(popupContent).openPopup();
      });
  });
})();
