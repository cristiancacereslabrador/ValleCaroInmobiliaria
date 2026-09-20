'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrokerSettings } from '../../lib/api/brokerSettings';
import type { BrokerSettings } from '../../lib/api/types';
import { resolveMediaUrl } from '../../lib/config';
import { buildWhatsAppLink } from '../../lib/format';
import { FALLBACK_ABOUT_TEXT, FALLBACK_PORTAL_NAME } from '../../lib/branding';
import { DEFAULT_TESTIMONIALS, parseTestimonials } from '../../lib/testimonials';
import { SocialLinks } from '../../components/SocialLinks';

export default function AboutPage() {
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
        if (!cancelled) setError('No se pudo cargar la información.');
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
  const testimonials = parseTestimonials(settings?.testimonials);
  const quotes = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  return (
    <main className="page page-editorial">
      <p className="eyebrow">La asesora</p>
      <h1>Nosotros</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="about-section">
        {settings?.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(settings.photoUrl)}
            alt={settings.advisorName ?? name}
            className="about-photo"
          />
        )}
        <div>
          <h2>{name}</h2>
          {settings?.slogan && <p className="page-subtitle">{settings.slogan}</p>}
          {settings?.advisorName && (
            <p className="advisor-line">
              <strong>{settings.advisorName}</strong>
              {settings.advisorTitle ? ` · ${settings.advisorTitle}` : ''}
            </p>
          )}
          {settings?.aboutText ? (
            <p className="property-description">{settings.aboutText}</p>
          ) : (
            <p>{FALLBACK_ABOUT_TEXT}</p>
          )}
          {settings?.coverageText && <p className="coverage-line">{settings.coverageText}</p>}
          <SocialLinks
            instagram={settings?.instagram}
            facebook={settings?.facebook}
            tiktok={settings?.tiktok}
            whatsapp={whatsapp}
            whatsappMessage={`Hola, quiero conocer ${name}.`}
          />
          {whatsapp && (
            <p>
              <a
                className="btn"
                href={buildWhatsAppLink(whatsapp, `Hola, quiero conocer ${name}.`)}
                target="_blank"
                rel="noreferrer"
              >
                Escribir a {settings?.advisorName?.split(' ')[0] || 'un asesor'}
              </a>
            </p>
          )}
          <p>
            <Link href="/contacto">Ver oficina y horario</Link>
          </p>
        </div>
      </div>
      {quotes.length > 0 && (
        <section className="testimonials">
          <h2>Lo que dicen de nosotros</h2>
          <p className="page-subtitle">Referencias de clientes en San Cristóbal y Táchira.</p>
          <div className="testimonial-grid">
            {quotes.map((item) => (
              <blockquote key={`${item.author}-${item.quote.slice(0, 24)}`} className="testimonial-card">
                <p>"{item.quote}"</p>
                <footer>
                  <strong>{item.author}</strong>
                  {item.place ? ` · ${item.place}` : ''}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

