'use client';

import { useEffect, useState } from 'react';
import { getBrokerSettings } from '../../lib/api/brokerSettings';
import type { BrokerSettings } from '../../lib/api/types';
import { FALLBACK_PORTAL_NAME } from '../../lib/branding';
import { buildWhatsAppLink } from '../../lib/format';
import { SocialLinks } from '../../components/SocialLinks';
import { LeadForm } from '../../components/LeadForm';

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
          <p>
            Deja tus datos y te respondemos. El mensaje llega al correo de la asesora y queda en el
            panel de leads.
          </p>
          <LeadForm />
          {whatsapp && (
            <p className="field-hint">
              También puedes escribir por{' '}
              <a
                href={buildWhatsAppLink(whatsapp, `Hola, escribo a ${name}. Quiero agendar una visita.`)}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
