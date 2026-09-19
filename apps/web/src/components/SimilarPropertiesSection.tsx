'use client';

import { useEffect, useState } from 'react';
import { getSimilarProperties } from '../lib/api/similarProperties';
import type { Property } from '../lib/api/types';
import { PropertyCard } from './PropertyCard';

interface SimilarPropertiesSectionProps {
  propertyId: string;
}

/**
 * Seccion "Propiedades similares" de la ficha de propiedad
 * (similar-properties spec, Requirement "Visualizacion de propiedades
 * similares en la ficha" - tasks.md 2.1): tarjetas con portada/precio/tipo,
 * navegables a su propia ficha. Reutiliza `PropertyCard` (mismo componente
 * del listado del catalogo, tasks.md 7.1) en vez de duplicar el marcado de
 * la tarjeta.
 *
 * Scenario "Ficha sin propiedades similares disponibles": la seccion se
 * omite por completo (ni titulo ni mensaje de "vacio") en vez de mostrarse
 * con un estado vacio, tal y como pide la spec ("la ficha se muestra
 * igualmente, omitiendo la sección de propiedades similares").
 */
export function SimilarPropertiesSection({ propertyId }: SimilarPropertiesSectionProps) {
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getSimilarProperties(propertyId)
      .then((data) => {
        if (!cancelled) setSimilarProperties(data);
      })
      .catch(() => {
        if (!cancelled) setSimilarProperties([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (!isLoading && similarProperties.length === 0) {
    return null;
  }

  return (
    <div className="section">
      <h2>Propiedades similares</h2>

      {isLoading ? (
        <p className="spinner-text">Cargando propiedades similares…</p>
      ) : (
        <div className="property-grid">
          {similarProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
