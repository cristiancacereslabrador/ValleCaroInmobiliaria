'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
    };
    if (document.readyState === 'complete') {
      onLoad();
      return;
    }
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
