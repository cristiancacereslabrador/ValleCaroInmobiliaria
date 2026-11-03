'use client';

import { useEffect, useState } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

interface NavigatorWithWakeLock {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
}

/**
 * Mantiene la pantalla encendida mientras `active` sea true (Screen Wake
 * Lock API: Chrome Android, Safari iOS 16.4+). El navegador suelta el bloqueo
 * al ocultar la pagina, asi que se vuelve a pedir al regresar. Devuelve si el
 * bloqueo esta activo, para avisar al usuario cuando el navegador no lo
 * soporta.
 */
export function useScreenWakeLock(active: boolean): boolean {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const api = (navigator as NavigatorWithWakeLock).wakeLock;
    if (!active || !api) {
      setLocked(false);
      return;
    }

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    async function acquire() {
      if (cancelled || document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) {
        return;
      }
      try {
        sentinel = await api!.request('screen');
        if (cancelled) {
          void sentinel.release();
          return;
        }
        setLocked(true);
        sentinel.addEventListener('release', () => setLocked(false));
      } catch {
        // Bateria baja o permiso denegado: se sigue sin bloqueo.
        setLocked(false);
      }
    }

    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', acquire);
      if (sentinel && !sentinel.released) void sentinel.release();
      setLocked(false);
    };
  }, [active]);

  return locked;
}
