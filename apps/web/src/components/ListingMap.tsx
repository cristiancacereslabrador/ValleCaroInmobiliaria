'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, InfoWindow, Marker, Polygon, Polyline } from '@react-google-maps/api';
import { getGoogleMapsApiKey, resolveMediaUrl } from '../lib/config';
import { useGoogleMapsLoader } from '../lib/googleMaps';
import { MapPlaceholder, MapUnavailableNotice } from './MapStatusNotice';
import type { AreaVertex, Property } from '../lib/api/types';
import { formatPrice, propertyTypeLabel } from '../lib/format';
import { SAN_CRISTOBAL_CENTER, SAN_CRISTOBAL_ZOOM } from '../lib/geo';

interface GeolocatedProperty extends Property {
  latitude: string;
  longitude: string;
}

function isGeolocated(property: Property): property is GeolocatedProperty {
  return property.latitude !== null && property.longitude !== null;
}

// Centro por defecto (San Cristóbal, Táchira) cuando no hay propiedades
// geolocalizadas. El broker puede sustituirlo vía BrokerSettings.
const DEFAULT_CENTER = SAN_CRISTOBAL_CENTER;
const DEFAULT_ZOOM = SAN_CRISTOBAL_ZOOM;

const POLYGON_OPTIONS: google.maps.PolygonOptions = {
  fillColor: '#2563eb',
  fillOpacity: 0.15,
  strokeColor: '#2563eb',
  strokeWeight: 2,
  clickable: false,
  editable: false,
};

interface ListingMapProps {
  properties: Property[];
  area: AreaVertex[] | undefined;
  onAreaChange: (area: AreaVertex[] | undefined) => void;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
}

/**
 * Mapa del listado (tasks.md 9.2, 5.1-5.3): marcadores de las propiedades
 * geolocalizadas del resultado filtrado (property-geolocation spec,
 * Requirement "Visualizacion de multiples propiedades en mapa") mas la
 * herramienta de dibujo de poligono (Drawing Library) para la busqueda por
 * area (property-geolocation spec, Requirement "Busqueda de propiedades por
 * area dibujada en el mapa"). El mapa se mantiene montado aunque el listado
 * no tenga propiedades geolocalizadas, porque tambien es la unica forma de
 * dibujar/limpiar el area de busqueda.
 */
export function ListingMap({
  properties,
  area,
  onAreaChange,
  defaultCenter = DEFAULT_CENTER,
  defaultZoom = DEFAULT_ZOOM,
}: ListingMapProps) {
  const geolocated = useMemo(() => properties.filter(isGeolocated), [properties]);

  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return (
      <div className="listing-map-wrapper">
        <MapUnavailableNotice reason="missingKey" />
      </div>
    );
  }

  return (
    <div className="listing-map-wrapper">
      <ListingMapLoaded
        properties={geolocated}
        apiKey={apiKey}
        area={area}
        onAreaChange={onAreaChange}
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
      />
    </div>
  );
}

function ListingMapLoaded({
  properties,
  apiKey,
  area,
  onAreaChange,
  defaultCenter,
  defaultZoom,
}: {
  properties: GeolocatedProperty[];
  apiKey: string;
  area: AreaVertex[] | undefined;
  onAreaChange: (area: AreaVertex[] | undefined) => void;
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
}) {
  const { isLoaded, hasError } = useGoogleMapsLoader(apiKey);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftPath, setDraftPath] = useState<AreaVertex[]>([]);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (properties.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        properties.forEach((property) => {
          bounds.extend({ lat: Number(property.latitude), lng: Number(property.longitude) });
        });
        map.fitBounds(bounds);
      }
    },
    [properties],
  );

  // tasks.md 5.3: si el area se limpia desde fuera (p. ej. "Limpiar filtros"
  // en PropertyFiltersBar), el poligono dibujado sobre el mapa debe
  // desaparecer tambien.
  useEffect(() => {
    if (area === undefined) {
      setDraftPath([]);
      setIsDrawing(false);
    }
  }, [area]);

  const completePolygon = useCallback(
    (vertices: AreaVertex[]) => {
      if (vertices.length < 3) {
        return;
      }
      setIsDrawing(false);
      setDraftPath([]);
      onAreaChange(vertices);
    },
    [onAreaChange],
  );

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!isDrawing || !event.latLng) {
        return;
      }
      const point: AreaVertex = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      setDraftPath((current) => [...current, point]);
    },
    [isDrawing],
  );

  const handleMapDblClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!isDrawing) {
        return;
      }
      event.stop();
      completePolygon(draftPath);
    },
    [completePolygon, draftPath, isDrawing],
  );

  function handleClearArea() {
    setDraftPath([]);
    setIsDrawing(false);
    onAreaChange(undefined);
  }

  if (hasError) {
    return <MapUnavailableNotice reason="error" />;
  }

  if (!isLoaded) {
    return <MapPlaceholder />;
  }

  const center =
    properties.length > 0
      ? { lat: Number(properties[0].latitude), lng: Number(properties[0].longitude) }
      : defaultCenter;
  const zoom = properties.length > 0 ? 12 : defaultZoom;
  const selected = properties.find((property) => property.id === selectedId) ?? null;

  return (
    <>
      <div className="map-drawing-controls">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setDraftPath([]);
            setIsDrawing(true);
          }}
          disabled={isDrawing}
        >
          Dibujar área de búsqueda
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => completePolygon(draftPath)}
          disabled={!isDrawing || draftPath.length < 3}
        >
          Cerrar área
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClearArea}
          disabled={!area && !isDrawing && draftPath.length === 0}
        >
          Limpiar área
        </button>
        {isDrawing && (
          <span className="map-drawing-hint">
            Haz clic en el mapa para marcar vértices. Con 3 o más puntos, pulsa Cerrar área o haz doble clic.
          </span>
        )}
      </div>

      <GoogleMap
        mapContainerClassName="map-container"
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        onClick={handleMapClick}
        onDblClick={handleMapDblClick}
        options={{ disableDoubleClickZoom: isDrawing }}
      >
        {area && area.length >= 3 ? <Polygon paths={area} options={POLYGON_OPTIONS} /> : null}
        {draftPath.length > 0 ? (
          <Polyline
            path={draftPath}
            options={{
              strokeColor: '#2563eb',
              strokeWeight: 2,
              clickable: false,
            }}
          />
        ) : null}

        {properties.map((property) => (
          <Marker
            key={property.id}
            position={{ lat: Number(property.latitude), lng: Number(property.longitude) }}
            onClick={() => setSelectedId(property.id)}
          />
        ))}
        {selected && (
          <InfoWindow
            position={{ lat: Number(selected.latitude), lng: Number(selected.longitude) }}
            onCloseClick={() => setSelectedId(null)}
          >
            <div className="map-info-card">
              {selected.coverPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveMediaUrl(selected.coverPhotoUrl)} alt="" />
              ) : null}
              <h3>{propertyTypeLabel(selected.type)}</h3>
              <p>{formatPrice(selected.price)}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </>
  );
}
