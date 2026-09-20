'use client';

import { useEffect, useState } from 'react';
import { chromeIntentUrl, isInAppBrowser, isIosDevice, isStandaloneDisplay } from '../lib/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export function PwaInstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'install' | 'ios' | 'inapp'>('install');

  useEffect(() => {
    if (isStandaloneDisplay()) return;
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

  return (
    <div className="pwa-banner" role="status">
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
      <div className="pwa-banner-actions">
        {mode === 'install' && installEvent && (
          <button type="button" className="btn" onClick={() => void install()}>
            Instalar
          </button>
        )}
        {mode === 'inapp' && inAppChrome && (
          <a className="btn" href={inAppChrome}>
            Abrir en Chrome
          </a>
        )}
        <button type="button" className="btn btn-secondary" onClick={dismiss}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
