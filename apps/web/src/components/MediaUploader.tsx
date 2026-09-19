'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { uploadMedia } from '../lib/api/media';
import { ApiError } from '../lib/api/client';
import type { PropertyMedia } from '../lib/api/types';

interface MediaUploaderProps {
  propertyId: string;
  onUploaded: (media: PropertyMedia) => void;
}

/**
 * Componente de carga de fotos/videos/tours virtuales 360 (tasks.md 8.1,
 * property-virtual-tours - tasks.md 2.2): sube el archivo seleccionado
 * contra `POST /api/v1/properties/:id/media` y muestra el error del backend
 * cuando el formato o el tamaño no son soportados (property-media spec,
 * Requirement "Validacion de formatos y tamaño de archivo").
 *
 * El checkbox "Es un tour virtual 360°" es la unica forma de pedir el tipo
 * `tour360`: el backend no puede distinguirlo de una foto normal solo por
 * la extension del archivo, ambos son imagenes (Requirement "Subir un tour
 * virtual 360 a una propiedad").
 */
export function MediaUploader({ propertyId, onUploaded }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTour360, setIsTour360] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const media = await uploadMedia(propertyId, file, isTour360 ? 'tour360' : undefined);
      onUploaded(media);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo subir el archivo. Inténtalo de nuevo.',
      );
    } finally {
      setIsUploading(false);
      setIsTour360(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div>
      <div className="uploader">
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.mp4,.webm"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <label className="uploader-tour-option">
          <input
            type="checkbox"
            checked={isTour360}
            onChange={(event) => setIsTour360(event.target.checked)}
            disabled={isUploading}
          />
          Es un tour virtual 360° (imagen panorámica equirectangular)
        </label>
        {isUploading && <span className="spinner-text">Subiendo…</span>}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
