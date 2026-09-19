'use client';

import { useEffect, useState } from 'react';
import { useJsApiLoader, type Libraries } from '@react-google-maps/api';

// Identificador estable requerido por useJsApiLoader para no reinyectar el
// script si varios componentes de mapa montan el hook a la vez.
export const GOOGLE_MAPS_SCRIPT_ID = 'google-map-script';

// Referencia module-level estable: si se recreara en cada render,
// useJsApiLoader recargaria el script en bucle. El array debe ser el mismo
// para todos los mapas que comparten `id` (detalle y listado).
// La Drawing Library de Google se retiro en Maps JS 3.65; el poligono de
// busqueda por area se dibuja con clics nativos sobre el mapa.
const GOOGLE_MAPS_LIBRARIES: Libraries = [];

declare global {
  interface Window {
    // Google Maps llama a este callback global cuando la clave de API no es
    // valida o la peticion no esta autorizada (referer/dominio) - es la
    // unica forma documentada de detectar ese fallo desde JS (property-
    // geolocation spec, Requirement "Manejo de error del servicio de Google
    // Maps").
    gm_authFailure?: () => void;
  }
}

export interface GoogleMapsLoadState {
  isLoaded: boolean;
  hasError: boolean;
}

/**
 * Carga la Maps JavaScript API (tasks.md 6.2) y expone un estado de error
 * unificado que cubre tanto el fallo de carga del script (red/servicio no
 * disponible) como el fallo de autenticacion (clave invalida o restringida
 * por referer), sin lanzar y sin bloquear el resto de la pagina.
 *
 * Solo debe montarse cuando ya se sabe que hay una API key configurada -
 * los componentes de mapa comprueban eso antes de renderizar el componente
 * que usa este hook, para no intentar cargar el script sin clave.
 */
export function useGoogleMapsLoader(apiKey: string): GoogleMapsLoadState {
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    window.gm_authFailure = () => setAuthFailed(true);
    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  return {
    isLoaded: isLoaded && !authFailed,
    hasError: Boolean(loadError) || authFailed,
  };
}
