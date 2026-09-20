'use client';

import { useEffect, useState } from 'react';
import {
  chromeIntentUrl,
  isHandheldDevice,
  isInAppBrowser,
  isIosDevice,
  isStandaloneDisplay,
} from '../lib/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export function PwaInstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'install' | 'ios' | 'inapp'>('install');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const forcePreview =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pwa') === '1';
    if (forcePreview) {
      setPreview(true);
      setMode('install');
      setVisible(true);
      return;
    }

    if (isStandaloneDisplay()) return;
    if (!isHandheldDevice()) return;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DISMISS_KEY)) return;

    if (isInAppBrowser()) {
      setMode('inapp');
      setVisible(true);
      return;
    }
    if (isIosDevice()) {
      setMode('ios');
      setVisible(true);
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      if (!isHandheldDevice()) return;
      setInstallEvent(event as BeforeInstallPromptEvent);
      setMode('install');
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    if (preview) return;
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    dismiss();
  }

  const inAppChrome = typeof window !== 'undefined' ? chromeIntentUrl(window.location.href) : null;
  const showInstall = (mode === 'install' && Boolean(installEvent)) || preview;

  return (
    <div className={`pwa-banner${preview ? ' is-preview' : ''}`} role="status">
      <div className="pwa-banner-copy">
        <span className="pwa-banner-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <rect x="7" y="2.5" width="10" height="19" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M10 5.2h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="12" cy="18.2" r="0.85" fill="currentColor" />
          </svg>
        </span>
        {mode === 'inapp' ? (
          <p>
            Estás dentro de WhatsApp u otra app. Ábrelo en el navegador e instálalo en el teléfono
            para subir fotos y vídeos sin que se corte al cambiar de chat.
          </p>
        ) : mode === 'ios' ? (
          <p>
            Para usarlo como app: toca Compartir y luego <strong>Añadir a pantalla de inicio</strong>.
          </p>
        ) : (
          <p>Instálalo en el teléfono y úsalo como app, en vez de desde el chat de WhatsApp.</p>
        )}
      </div>
      <div className="pwa-banner-actions">
        {showInstall && (
          <button type="button" className="btn" onClick={() => void install()}>
            Instalar
          </button>
        )}
        {mode === 'inapp' && inAppChrome && (
          <a className="btn" href={inAppChrome}>
            Abrir en Chrome
          </a>
        )}
        <button type="button" className="pwa-banner-dismiss" onClick={dismiss}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
