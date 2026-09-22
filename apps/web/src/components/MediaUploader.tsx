'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { uploadMedia } from '../lib/api/media';
import { ApiError } from '../lib/api/client';
import type { PropertyMedia } from '../lib/api/types';
import { prepareMediaFile } from '../lib/prepareMediaUpload';
import { isHandheldDevice, isInAppBrowser, isStandaloneDisplay } from '../lib/pwa';

interface MediaUploaderProps {
  propertyId: string;
  onUploaded: (media: PropertyMedia) => void;
}

const DESKTOP_ACCEPT = 'image/*,video/*,.heic,.heif,.heics,.mov,.m4v,.mp4,.webm,.jpg,.jpeg,.png,.webp';
const MOBILE_ACCEPT = 'image/*,video/*';
const MAX_ATTEMPTS = 4;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableUploadError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 408 || err.status === 429 || err.status >= 500;
  }
  return true;
}

function uploadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return 'La sesión caducó. Entra otra vez al panel y vuelve a subir las fotos.';
    }
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return 'No se pudo subir el archivo. Inténtalo de nuevo.';
}

interface QueueItem {
  file: File;
  tour360: boolean;
}

export function MediaUploader({ propertyId, onUploaded }: MediaUploaderProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const runningRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isTour360, setIsTour360] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const accept = showCamera ? MOBILE_ACCEPT : DESKTOP_ACCEPT;

  const drainQueue = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsUploading(true);
    setError(null);

    try {
      while (queueRef.current.length > 0) {
        const item = queueRef.current[0];
        setCurrentName(item.file.name || 'archivo');
        setProgress(0);
        setPendingCount(queueRef.current.length);

        let lastError: unknown;
        let uploaded = false;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
          try {
            const prepared = await prepareMediaFile(item.file);
            const media = await uploadMedia(
              propertyId,
              prepared,
              item.tour360 ? 'tour360' : undefined,
              (percent) => setProgress(percent),
            );
            onUploaded(media);
            queueRef.current.shift();
            setPendingCount(queueRef.current.length);
            uploaded = true;
            break;
          } catch (err) {
            lastError = err;
            if (!isRetryableUploadError(err) || attempt === MAX_ATTEMPTS) {
              break;
            }
            await sleep(800 * attempt);
          }
        }

        if (!uploaded) {
          setError(
            `${uploadErrorMessage(lastError)} Si cambiaste de app, vuelve aquí: se reintenta solo.`,
          );
          break;
        }
      }
    } finally {
      runningRef.current = false;
      setIsUploading(queueRef.current.length > 0 && document.visibilityState === 'visible');
      if (queueRef.current.length === 0) {
        setIsUploading(false);
        setProgress(null);
        setCurrentName(null);
      }
    }
  }, [onUploaded, propertyId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShowCamera(isHandheldDevice());
    if (isInAppBrowser()) {
      setHint(
        'Ábrelo en Chrome o Safari, no desde WhatsApp: al cambiar de chat Android corta la subida.',
      );
    } else if (!isStandaloneDisplay()) {
      setHint('En el teléfono usa Galería o Tomar foto. Puedes marcar varias a la vez.');
    } else {
      setHint('Puedes marcar varias fotos o vídeos. Si sales un momento, al volver se reintenta.');
    }
  }, []);

  useEffect(() => {
    function resume() {
      if (document.visibilityState === 'visible' && queueRef.current.length > 0) {
        void drainQueue();
      }
    }
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    return () => {
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
    };
  }, [drainQueue]);

  function enqueueFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    queueRef.current.push(...files.map((file) => ({ file, tour360: isTour360 })));
    setPendingCount(queueRef.current.length);
    setIsTour360(false);
    void drainQueue();
  }

  function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    enqueueFiles(event.target.files);
    if (galleryRef.current) galleryRef.current.value = '';
  }

  function handleCameraChange(event: ChangeEvent<HTMLInputElement>) {
    enqueueFiles(event.target.files);
    if (cameraRef.current) cameraRef.current.value = '';
  }

  return (
    <div>
      <p className="page-subtitle">
        En Android: Galería o Tomar foto. JPG, HEIC, PNG, WebP, MP4 y MOV. Las fotos grandes se
        achican solas para que no falle la subida.
        {hint ? ` ${hint}` : ''}
      </p>
      <div className="uploader">
        <input
          ref={galleryRef}
          id="media-gallery-input"
          className="uploader-input"
          type="file"
          accept={accept}
          multiple
          onChange={handleGalleryChange}
        />
        <label htmlFor="media-gallery-input" className="btn btn-secondary">
          Elegir de la galería
        </label>
        {showCamera && (
          <>
            <input
              ref={cameraRef}
              id="media-camera-input"
              className="uploader-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraChange}
            />
            <label htmlFor="media-camera-input" className="btn btn-secondary">
              Tomar foto
            </label>
          </>
        )}
        <label className="uploader-tour-option">
          <input
            type="checkbox"
            checked={isTour360}
            onChange={(event) => setIsTour360(event.target.checked)}
            disabled={isUploading}
          />
          Es un tour virtual 360° (imagen panorámica equirectangular)
        </label>
        {isUploading && (
          <span className="spinner-text">
            Subiendo{currentName ? ` ${currentName}` : ''}
            {progress !== null ? ` · ${progress}%` : '…'}
            {pendingCount > 1 ? ` · quedan ${pendingCount}` : ''}
          </span>
        )}
      </div>
      {isUploading && progress !== null && (
        <div className="upload-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          {error}{' '}
          <button type="button" className="btn btn-secondary" onClick={() => void drainQueue()}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
