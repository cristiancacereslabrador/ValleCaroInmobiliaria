// property-geolocation spec, Requirement "Manejo de error del servicio de
// Google Maps": degrada mostrando un aviso en vez de un mapa roto, sin
// bloquear el resto de la ficha/listado.
export function MapUnavailableNotice({ reason }: { reason: 'missingKey' | 'error' }) {
  return (
    <div className="map-notice map-notice-error" role="status">
      <p>
        {reason === 'missingKey'
          ? 'El mapa no está disponible: no hay una clave de Google Maps configurada.'
          : 'El mapa no está disponible temporalmente (el servicio de Google Maps no respondió o la clave de API no es válida).'}
      </p>
    </div>
  );
}

export function MapPlaceholder() {
  return (
    <div className="map-notice" role="status">
      <p>Cargando mapa…</p>
    </div>
  );
}
