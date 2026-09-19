export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Comprobacion punto-en-poligono mediante ray-casting (design.md - Decision
 * 2: "Filtrado por poligono: comprobacion punto-en-poligono en la capa de
 * aplicacion, no en SQL espacial"). Funcion pura, sin dependencias externas,
 * pensada para ser exhaustivamente testeada de forma unitaria (tasks.md 3.1).
 *
 * Los puntos situados exactamente sobre el borde del poligono (incluidos sus
 * vertices) se consideran DENTRO: la spec (property-geolocation,
 * "Busqueda de propiedades por area dibujada en el mapa") no distingue ese
 * caso limite explicitamente, y tratar el borde como "dentro" evita excluir
 * por un margen de redondeo una propiedad que el usuario ve visualmente
 * dentro del area dibujada.
 */
export function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  if (polygon.length < 3) {
    return false;
  }

  if (isOnPolygonBoundary(point, polygon)) {
    return true;
  }

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const vertexI = polygon[i];
    const vertexJ = polygon[j];

    const crossesRay = vertexI.lat > point.lat !== vertexJ.lat > point.lat;
    if (!crossesRay) {
      continue;
    }

    const intersectionLng =
      ((vertexJ.lng - vertexI.lng) * (point.lat - vertexI.lat)) / (vertexJ.lat - vertexI.lat) +
      vertexI.lng;

    if (point.lng < intersectionLng) {
      inside = !inside;
    }
  }

  return inside;
}

function isOnPolygonBoundary(point: GeoPoint, polygon: GeoPoint[]): boolean {
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (isOnSegment(point, polygon[j], polygon[i])) {
      return true;
    }
  }
  return false;
}

function isOnSegment(point: GeoPoint, a: GeoPoint, b: GeoPoint): boolean {
  const EPSILON = 1e-9;

  // Colinealidad: el producto cruzado de (point - a) y (b - a) debe ser ~0.
  const crossProduct = (point.lat - a.lat) * (b.lng - a.lng) - (point.lng - a.lng) * (b.lat - a.lat);
  if (Math.abs(crossProduct) > EPSILON) {
    return false;
  }

  // Colineal pero hay que confirmar que cae DENTRO del segmento (no en su
  // prolongacion) comprobando la proyeccion escalar sobre el vector a->b.
  const dotProduct = (point.lng - a.lng) * (b.lng - a.lng) + (point.lat - a.lat) * (b.lat - a.lat);
  if (dotProduct < 0) {
    return false;
  }

  const squaredLength = (b.lng - a.lng) ** 2 + (b.lat - a.lat) ** 2;
  return dotProduct <= squaredLength;
}
