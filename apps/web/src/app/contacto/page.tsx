'use client';

import { useEffect, useState } from 'react';
import { getBrokerSettings } from '../../lib/api/brokerSettings';
import type { BrokerSettings } from '../../lib/api/types';
import { FALLBACK_PORTAL_NAME } from '../../lib/branding';
import { buildWhatsAppLink } from '../../lib/format';
import { SocialLinks } from '../../components/SocialLinks';

export default function ContactPage() {
  const [settings, setSettings] = useState<BrokerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBrokerSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar la información de contacto.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <main className="page">
        <p className="spinner-text">Cargando…</p>
      </main>
    );
  }

  const name = settings?.businessName?.trim() || FALLBACK_PORTAL_NAME;
  const whatsapp = settings?.whatsapp?.trim() || '';

  return (
    <main className="page page-editorial">
      <p className="eyebrow">Hablemos</p>
      <h1>Contacto</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="contact-grid">
        <div className="section contact-card">
          <h2>{name}</h2>
          {settings?.advisorName && (
            <p>
              {settings.advisorName}
              {settings.advisorTitle ? ` · ${settings.advisorTitle}` : ''}
            </p>
          )}
          {settings?.officeAddress && (
            <p>
              <strong>Oficina</strong>
              <br />
              {settings.officeAddress}
            </p>
          )}
          {settings?.phone && (
            <p>
              <strong>Teléfono</strong>
              <br />
              {settings.phone}
            </p>
          )}
          {settings?.email && (
            <p>
              <strong>Email</strong>
              <br />
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </p>
          )}
          {settings?.businessHours && (
            <p>
              <strong>Horario</strong>
              <br />
              {settings.businessHours}
            </p>
          )}
          {settings?.coverageText && (
            <p>
              <strong>Cobertura</strong>
              <br />
              {settings.coverageText}
            </p>
          )}
          {(settings?.instagram || settings?.facebook || settings?.tiktok || whatsapp) && (
            <div>
              <strong>Redes</strong>
              <SocialLinks
                instagram={settings?.instagram}
                facebook={settings?.facebook}
                tiktok={settings?.tiktok}
                whatsapp={whatsapp}
                whatsappMessage={`Hola, escribo a ${name}.`}
              />
            </div>
          )}
        </div>
        <div className="section contact-card">
          <h2>Agenda una visita</h2>
          <p>Cuéntanos qué buscas. Respondemos por WhatsApp el mismo día hábil.</p>
          {whatsapp ? (
            <a
              className="btn"
              href={buildWhatsAppLink(whatsapp, `Hola, escribo a ${name}.`)}
              target="_blank"
              rel="noreferrer"
            >
              Escribir por WhatsApp
            </a>
          ) : (
            <p>El canal de WhatsApp se configura desde el panel.</p>
          )}
        </div>
      </div>
    </main>
  );
}
