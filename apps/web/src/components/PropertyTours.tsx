'use client';

import { useState } from 'react';
import { MediaType, type PropertyMedia } from '../lib/api/types';
import { deleteMedia } from '../lib/api/media';
import { ApiError } from '../lib/api/client';
import { resolveMediaUrl } from '../lib/config';
import { PanoramaViewer } from './PanoramaViewer';

interface PropertyToursProps {
  propertyId: string;
  media: PropertyMedia[];
  onChange: (media: PropertyMedia[]) => void;
  canManage?: boolean;
}

/**
 * Seccion "Tour virtual 360°" de la ficha de propiedad
 * (property-virtual-tours - tasks.md 2.2): un visor interactivo por cada
 * tour asociado a la propiedad.
 *
 * Requirement "Visualizacion interactiva del tour virtual" - Scenario
 * "Ficha sin tours virtuales": si no hay ningun medio de tipo `tour360` la
 * seccion entera no se renderiza (a diferencia de "Fotos y vídeos", que
 * siempre se muestra).
 */
export function PropertyTours({
  propertyId,
  media,
  onChange,
  canManage = false,
}: PropertyToursProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const tours = media.filter((item) => item.type === MediaType.TOUR_360);

  if (tours.length === 0) {
    return null;
  }

  async function handleDelete(mediaId: string) {
    setError(null);
    setPendingId(mediaId);
    try {
      await deleteMedia(propertyId, mediaId);
      onChange(media.filter((item) => item.id !== mediaId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar el tour virtual.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="section">
      <h2>Tour virtual 360°</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="tour-gallery">
        {tours.map((item) => (
          <div key={item.id} className="tour-item">
            <PanoramaViewer imageUrl={resolveMediaUrl(item.url)} />
            <div className="tour-item-body">
              <span className="spinner-text">Arrastra para rotar, rueda/controles para zoom</span>
              {canManage && (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={pendingId === item.id}
                  onClick={() => handleDelete(item.id)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
