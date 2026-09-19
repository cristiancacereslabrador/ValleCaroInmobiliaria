'use client';

import { useEffect, useState } from 'react';
import { getNearbyServices } from '../lib/api/nearbyServices';
import type { NearbyPlace, NearbyServicesResult } from '../lib/api/nearbyServices';

interface NearbyServicesSectionProps {
  propertyId: string;
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }
  return `${distanceMeters} m`;
}

function CategoryList({ title, places }: { title: string; places: NearbyPlace[] }) {
  return (
    <div className="spec-item">
      <dt>{title}</dt>
      <dd>
        {places.length === 0 ? (
          'Sin resultados en el radio de búsqueda'
        ) : (
          <ul className="nearby-services-list">
            {places.map((place) => (
              <li key={`${place.name}-${place.distanceMeters}`}>
                {place.name} · {formatDistance(place.distanceMeters)}
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}

/**
 * Seccion "Entorno" de la ficha de propiedad (nearby-services spec,
 * Requirement "Visualizacion del entorno en la ficha de propiedad" -
 * tasks.md 6.1): colegios, transporte y supermercados cercanos agrupados por
 * categoria, cada uno con su distancia aproximada.
 *
 * Scenario "Ficha sin entorno disponible": tanto si la propiedad no tiene
 * coordenadas como si el servicio externo falla, la seccion se muestra
 * igualmente indicando que el entorno no esta disponible (en vez de
 * desaparecer u ocultar el resto de la ficha).
 */
export function NearbyServicesSection({ propertyId }: NearbyServicesSectionProps) {
  const [result, setResult] = useState<NearbyServicesResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getNearbyServices(propertyId)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setResult({ available: false, reason: 'service-unavailable' });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return (
    <div className="section">
      <h2>Entorno</h2>

      {isLoading && <p className="spinner-text">Cargando entorno…</p>}

      {!isLoading && result?.available && (
        <dl className="spec-grid">
          <CategoryList title="Colegios" places={result.categories.schools} />
          <CategoryList title="Transporte" places={result.categories.transitStops} />
          <CategoryList title="Supermercados" places={result.categories.supermarkets} />
        </dl>
      )}

      {!isLoading && result && !result.available && (
        <p className="alert alert-info">
          {result.reason === 'no-coordinates'
            ? 'Esta propiedad no tiene coordenadas asignadas, así que no se puede mostrar su entorno.'
            : 'La información de entorno no está disponible temporalmente.'}
        </p>
      )}
    </div>
  );
}
