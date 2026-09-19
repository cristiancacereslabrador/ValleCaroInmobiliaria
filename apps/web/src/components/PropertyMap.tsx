'use client';

import { GoogleMap, Marker } from '@react-google-maps/api';
import { getGoogleMapsApiKey } from '../lib/config';
import { useGoogleMapsLoader } from '../lib/googleMaps';
import { MapPlaceholder, MapUnavailableNotice } from './MapStatusNotice';

interface PropertyMapProps {
  latitude: string | null;
  longitude: string | null;
}

/**
 * Mapa de detalle de una propiedad (tasks.md 9.1): marcador centrado en sus
 * coordenadas, o ausencia total del componente si la propiedad no tiene
 * coordenadas asignadas (property-geolocation spec, Scenario "Propiedad sin
 * coordenadas").
 */
export function PropertyMap({ latitude, longitude }: PropertyMapProps) {
  if (!latitude || !longitude) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return (
      <div className="detail-map-wrapper">
        <MapUnavailableNotice reason="missingKey" />
      </div>
    );
  }

  return (
    <div className="detail-map-wrapper">
      <PropertyMapLoaded lat={lat} lng={lng} apiKey={apiKey} />
    </div>
  );
}

function PropertyMapLoaded({ lat, lng, apiKey }: { lat: number; lng: number; apiKey: string }) {
  const { isLoaded, hasError } = useGoogleMapsLoader(apiKey);

  if (hasError) {
    return <MapUnavailableNotice reason="error" />;
  }

  if (!isLoaded) {
    return <MapPlaceholder />;
  }

  const position = { lat, lng };

  return (
    <GoogleMap mapContainerClassName="map-container" center={position} zoom={15}>
      <Marker position={position} />
    </GoogleMap>
  );
}
