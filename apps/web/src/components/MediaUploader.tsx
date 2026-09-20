'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { uploadMedia } from '../lib/api/media';
import { ApiError } from '../lib/api/client';
import type { PropertyMedia } from '../lib/api/types';
import { isInAppBrowser, isStandaloneDisplay } from '../lib/pwa';

interface MediaUploaderProps {
  propertyId: string;
  onUploaded: (media: PropertyMedia) => void;
}

const FILE_INPUT_ACCEPT = 'image/*,video/*,.heic,.heif,.heics,.mov,.m4v,.mp4,.webm,.jpg,.jpeg,.png,.webp';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const runningRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isTour360, setIsTour360] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const drainQueue = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsUploading(true);
    setError(null);

    try {
      while (queueRef.current.length > 0) {
        const item = queueRef.current[0];
        setCurrentName(item.file.name);
        setProgress(0);
        setPendingCount(queueRef.current.length);

        let lastError: unknown;
        let uploaded = false;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
          try {
            const media = await uploadMedia(
              propertyId,
              item.file,
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
    if (isInAppBrowser()) {
      setHint('Ábrelo en Chrome o Safari, o instálalo en el teléfono. Desde WhatsApp la subida se corta al cambiar de chat.');
    } else if (!isStandaloneDisplay()) {
      setHint('Puedes instalarlo como app en el teléfono. En PC y en el celular funciona igual; las fotos se pueden elegir varias a la vez.');
    } else {
      setHint('Puedes marcar varias fotos o vídeos. Si sales un momento, al volver se reintenta lo que quedó pendiente.');
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    queueRef.current.push(...files.map((file) => ({ file, tour360: isTour360 })));
    setPendingCount(queueRef.current.length);
    setIsTour360(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    void drainQueue();
  }

  return (
    <div>
      <p className="page-subtitle">
        En el teléfono: Galería, Fotos o Archivos. En el computador: carpeta de fotos. JPG, HEIC,
        PNG, WebP, MP4, MOV y WebM.
        {hint ? ` ${hint}` : ''}
      </p>
      <div className="uploader">
        <input
          ref={inputRef}
          type="file"
          accept={FILE_INPUT_ACCEPT}
          multiple
          onChange={handleFileChange}
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
