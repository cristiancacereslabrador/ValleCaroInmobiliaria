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
import { FALLBACK_PORTAL_LEGAL, FALLBACK_PORTAL_NAME, FALLBACK_PORTAL_SLOGAN } from '../lib/branding';
import { PwaInstallBanner } from './PwaInstallBanner';
import { WhatsAppCta } from './WhatsAppCta';
import { SocialLinks } from './SocialLinks';

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function contrastOn(hex: string): string {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 3 && raw.length !== 6) return '#121212';
  const full = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 150 ? '#f7efe0' : '#121212';
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
  const [headerSolid, setHeaderSolid] = useState(false);

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
    if (pathname !== '/') {
      setHeaderSolid(false);
      return;
    }
    const onScroll = () => setHeaderSolid(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.primaryColor) {
      root.style.setProperty('--color-primary', settings.primaryColor);
      root.style.setProperty('--btn-on-primary', contrastOn(settings.primaryColor));
    }
    if (settings.secondaryColor) {
      root.style.setProperty('--color-primary-dark', settings.secondaryColor);
    }
    const title = settings.businessName?.trim() || FALLBACK_PORTAL_NAME;
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

  const businessName = settings?.businessName?.trim() || FALLBACK_PORTAL_NAME;
  const showAdminHeader = isAdminPath(pathname) && pathname !== '/admin/login';
  const whatsapp = settings?.whatsapp?.trim() || '';
  const isPropertyDetail = /^\/properties\/[^/]+$/.test(pathname);
  const showWhatsAppFab = Boolean(whatsapp) && !showAdminHeader && !isPropertyDetail;
  const isHome = pathname === '/';
  const fabMessage =
    pathname.startsWith('/captacion')
      ? `Hola, quiero vender o alquilar con ${businessName}.`
      : pathname.startsWith('/valuation')
        ? `Hola, quiero tasar un inmueble con ${businessName}.`
        : `Hola, me interesa una propiedad de ${businessName}.`;

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
        <header
          className={`site-header ${isHome ? 'site-header-over-hero' : ''} ${
            isHome && (headerSolid || navOpen) ? 'is-solid' : ''
          }`}
        >
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
            <Link href="/captacion" className={pathname.startsWith('/captacion') ? 'is-active' : undefined}>
              Quiero vender
            </Link>
            <Link href="/valuation" className={pathname.startsWith('/valuation') ? 'is-active' : undefined}>
              Solicitar tasación
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
              <WhatsAppCta
                className="btn"
                digits={whatsapp}
                message={`Hola, escribo a ${businessName}.`}
              >
                Hablar con un asesor
              </WhatsAppCta>
            )}
          </nav>
        </header>
      )}

      {children}

      {!showAdminHeader && <PwaInstallBanner />}

      {!showAdminHeader && (
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div>
              <p className="footer-brand">{businessName}</p>
              <p>{settings?.slogan || FALLBACK_PORTAL_SLOGAN}</p>
              {settings?.advisorName && (
                <p>
                  {settings.advisorName}
                  {settings.advisorTitle ? ` · ${settings.advisorTitle}` : ''}
                </p>
              )}
              <SocialLinks
                instagram={settings?.instagram}
                facebook={settings?.facebook}
                tiktok={settings?.tiktok}
                whatsapp={whatsapp}
                whatsappMessage={`Hola, escribo a ${businessName}.`}
              />
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
              <p className="footer-label">Sitio</p>
              <p>
                <Link href="/">Catálogo</Link>
              </p>
              <p>
                <Link href="/captacion">Quiero vender</Link>
              </p>
              <p>
                <Link href="/valuation">Solicitar tasación</Link>
              </p>
              <p>
                <Link href="/nosotros">Nosotros</Link>
              </p>
              <p>
                <Link href="/contacto">Contacto</Link>
              </p>
            </div>
            <div>
              <p className="footer-label">Cobertura</p>
              <p>{settings?.coverageText || 'San Cristóbal, Táchira, Venezuela'}</p>
              <p>
                <Link href="/contacto">Agendar visita</Link>
              </p>
            </div>
          </div>
          <p className="site-footer-legal">
            {settings?.footerLegal || FALLBACK_PORTAL_LEGAL}
          </p>
        </footer>
      )}

      {showWhatsAppFab && (
        <WhatsAppCta className="whatsapp-fab" digits={whatsapp} message={fabMessage}>
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path
              fill="currentColor"
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
            />
          </svg>
          <span className="visually-hidden">WhatsApp</span>
        </WhatsAppCta>
      )}
    </>
  );
}
