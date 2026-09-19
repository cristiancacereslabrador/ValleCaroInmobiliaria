'use client';

import { useState } from 'react';
import { MediaType, type PropertyMedia } from '../lib/api/types';
import { deleteMedia, markCoverPhoto } from '../lib/api/media';
import { ApiError } from '../lib/api/client';
import { resolveMediaUrl } from '../lib/config';

interface MediaGalleryProps {
  propertyId: string;
  media: PropertyMedia[];
  onChange: (media: PropertyMedia[]) => void;
}

/**
 * Galeria de medios del detalle de propiedad (tasks.md 8.2): listar, marcar
 * portada y eliminar (property-media spec, Requirements "Listar medios de
 * una propiedad", "Foto de portada de la propiedad" y "Eliminar un medio de
 * una propiedad").
 *
 * Solo fotos y videos: los tours virtuales 360 (`MediaType.TOUR_360`) tienen
 * su propia seccion con visor interactivo, ver `PropertyTours`
 * (property-virtual-tours - tasks.md 2.2).
 */
export function MediaGallery({ propertyId, media, onChange }: MediaGalleryProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const photosAndVideos = media.filter(
    (item) => item.type === MediaType.PHOTO || item.type === MediaType.VIDEO,
  );

  async function handleMarkCover(mediaId: string) {
    setError(null);
    setPendingId(mediaId);
    try {
      const updated = await markCoverPhoto(propertyId, mediaId);
      onChange(
        media.map((item) =>
          item.id === updated.id
            ? updated
            : item.type === MediaType.PHOTO
              ? { ...item, isCover: false }
              : item,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo marcar la portada.');
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(mediaId: string) {
    setError(null);
    setPendingId(mediaId);
    try {
      await deleteMedia(propertyId, mediaId);
      onChange(media.filter((item) => item.id !== mediaId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar el archivo.');
    } finally {
      setPendingId(null);
    }
  }

  if (photosAndVideos.length === 0) {
    return <p className="spinner-text">Todavía no se ha subido ninguna foto o vídeo.</p>;
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="media-gallery">
        {photosAndVideos.map((item) => (
          <div key={item.id} className="media-item">
            {item.isCover && <span className="cover-badge">Portada</span>}
            {item.type === MediaType.PHOTO ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(item.url)} alt="" />
            ) : (
              <video src={resolveMediaUrl(item.url)} controls muted />
            )}
            <div className="media-item-body">
              <div className="media-item-actions">
                {item.type === MediaType.PHOTO && !item.isCover && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={pendingId === item.id}
                    onClick={() => handleMarkCover(item.id)}
                  >
                    Marcar portada
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={pendingId === item.id}
                  onClick={() => handleDelete(item.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
