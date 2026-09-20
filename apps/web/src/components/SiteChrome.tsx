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
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12.04 3.2A8.7 8.7 0 0 0 3.4 11.9c0 1.53.4 3.02 1.16 4.34L3.2 20.8l4.7-1.32A8.7 8.7 0 0 0 12.04 20.6 8.7 8.7 0 0 0 20.8 11.9 8.7 8.7 0 0 0 12.04 3.2zm4.15 10.46c-.23-.11-1.34-.66-1.55-.73-.21-.08-.36-.11-.51.11-.15.23-.58.73-.71.88-.13.15-.26.17-.49.06-.23-.11-.96-.35-1.83-1.13-.68-.6-1.13-1.35-1.27-1.58-.13-.23-.01-.35.1-.46.1-.1.23-.26.34-.4.11-.13.15-.23.23-.38.08-.15.04-.28-.02-.4-.06-.11-.51-1.23-.7-1.68-.18-.44-.37-.38-.51-.39h-.43c-.15 0-.4.06-.6.28-.21.23-.8.78-.8 1.9 0 1.12.82 2.2.93 2.35.11.15 1.62 2.47 3.92 3.46.55.24.97.38 1.3.48.55.18 1.04.15 1.43.09.44-.07 1.34-.55 1.53-1.08.19-.53.19-.98.13-1.08-.05-.09-.21-.15-.44-.26z"
            />
          </svg>
          <span className="visually-hidden">WhatsApp</span>
        </WhatsAppCta>
      )}
    </>
  );
}
