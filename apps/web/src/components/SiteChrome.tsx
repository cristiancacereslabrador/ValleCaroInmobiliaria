'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getMe, logout } from '../lib/api/auth';
import { getBrokerSettings } from '../lib/api/brokerSettings';
import { ApiError } from '../lib/api/client';
import type { BrokerSettings, BrokerUser } from '../lib/api/types';
import { resolveMediaUrl } from '../lib/config';
import { buildWhatsAppLink } from '../lib/format';

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function brandInitials(name: string): string {
  const first = name.trim().split(/\s+/).filter(Boolean)[0] ?? 'VC';
  return first.slice(0, 2).toUpperCase();
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [settings, setSettings] = useState<BrokerSettings | null>(null);
  const [user, setUser] = useState<BrokerUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getBrokerSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      });

    getMe()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.primaryColor) {
      root.style.setProperty('--color-primary', settings.primaryColor);
    }
    if (settings.secondaryColor) {
      root.style.setProperty('--color-primary-dark', settings.secondaryColor);
    }
    const title = settings.businessName?.trim() || 'Inmobiliaria';
    document.title = title;
  }, [settings]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setIsLoggingOut(false);
        return;
      }
    }
    setUser(null);
    router.push('/');
    router.refresh();
    setIsLoggingOut(false);
  }

  const businessName = settings?.businessName?.trim() || 'Inmobiliaria';
  const showAdminHeader = isAdminPath(pathname) && pathname !== '/admin/login';
  const whatsapp = settings?.whatsapp?.trim() || '';
  const showWhatsAppFab = false;
  const isHome = pathname === '/';

  return (
    <>
      {showAdminHeader ? (
        <header className="site-header site-header-admin">
          <Link href="/admin" className="brand">
            {settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(settings.logoUrl)} alt="" className="brand-logo" />
            ) : (
              <span className="brand-mark" aria-hidden="true">
                {brandInitials(businessName)}
              </span>
            )}
            <span>Panel · {businessName}</span>
          </Link>
          <nav>
            <Link href="/admin">Mis propiedades</Link>
            <Link href="/admin/leads">Leads</Link>
            <Link href="/admin/ajustes">Ajustes</Link>
            <Link href="/" className="btn btn-secondary">
              Ver sitio
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Saliendo…' : 'Cerrar sesión'}
            </button>
          </nav>
        </header>
      ) : (
        <header className={`site-header ${isHome ? 'site-header-over-hero' : ''}`}>
          <Link href="/" className="brand">
            {settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(settings.logoUrl)} alt="" className="brand-logo" />
            ) : (
              <span className="brand-mark" aria-hidden="true">
                {brandInitials(businessName)}
              </span>
            )}
            <span>{businessName}</span>
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setNavOpen((open) => !open)}
          >
            {navOpen ? 'Cerrar' : 'Menú'}
          </button>
          <nav className={navOpen ? 'is-open' : undefined}>
            <Link href="/" className={pathname === '/' ? 'is-active' : undefined}>
              Catálogo
            </Link>
            <Link href="/valuation" className={pathname.startsWith('/valuation') ? 'is-active' : undefined}>
              Estimar valor
            </Link>
            <Link href="/nosotros" className={pathname.startsWith('/nosotros') ? 'is-active' : undefined}>
              Nosotros
            </Link>
            <Link href="/contacto" className={pathname.startsWith('/contacto') ? 'is-active' : undefined}>
              Contacto
            </Link>
            {user && (
              <Link href="/admin" className="btn btn-secondary">
                Panel
              </Link>
            )}
            {whatsapp && (
              <a
                className="btn"
                href={buildWhatsAppLink(whatsapp, `Hola, escribo a ${businessName}.`)}
                target="_blank"
                rel="noreferrer"
              >
                Hablar con un asesor
              </a>
            )}
          </nav>
        </header>
      )}

      {children}

      {!showAdminHeader && (
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div>
              <p className="footer-brand">{businessName}</p>
              <p>{settings?.slogan || 'Inmobiliaria en San Cristóbal, Táchira.'}</p>
              {settings?.advisorName && (
                <p>
                  {settings.advisorName}
                  {settings.advisorTitle ? ` · ${settings.advisorTitle}` : ''}
                </p>
              )}
            </div>
            <div>
              <p className="footer-label">Oficina</p>
              {settings?.officeAddress && <p>{settings.officeAddress}</p>}
              {settings?.phone && <p>Tel. {settings.phone}</p>}
              {settings?.email && (
                <p>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </p>
              )}
              {whatsapp && (
                <p>
                  <a href={buildWhatsAppLink(whatsapp, `Hola, escribo a ${businessName}.`)}>WhatsApp</a>
                </p>
              )}
              {settings?.businessHours && <p>{settings.businessHours}</p>}
            </div>
            <div>
              <p className="footer-label">Cobertura</p>
              <p>{settings?.coverageText || 'San Cristóbal, Táchira, Venezuela'}</p>
              {settings?.instagram && <p>Instagram {settings.instagram}</p>}
              {settings?.facebook && <p>Facebook {settings.facebook}</p>}
              {settings?.tiktok && <p>TikTok {settings.tiktok}</p>}
              <p>
                <Link href="/contacto">Agendar visita</Link>
              </p>
            </div>
          </div>
          <p className="site-footer-legal">
            {settings?.footerLegal || 'ValleCaro Inmobiliaria · San Cristóbal, Táchira'}
          </p>
        </footer>
      )}

      {showWhatsAppFab && (
        <a
          className="whatsapp-fab"
          href={buildWhatsAppLink(whatsapp, `Hola, me interesa una propiedad de ${businessName}.`)}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
      )}
    </>
  );
}
