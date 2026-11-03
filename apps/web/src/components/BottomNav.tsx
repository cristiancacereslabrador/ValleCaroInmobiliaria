'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Iconos de 24x24 con trazo (estilo Material Symbols Outlined). */
const ICONS = {
  home: 'M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z',
  sell: 'M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1.4 1.4 0 0 1 0 2l-6.1 6.1a1.4 1.4 0 0 1-2 0zM8 8h.01',
  valuation: 'M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM8 7.5h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01',
  contact: 'M4.5 5h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4.5 3.5V6a1 1 0 0 1 1-1zM8 9.5h8M8 13h5',
  more: 'M4 6.5h16M4 12h16M4 17.5h16',
  list: 'M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  add: 'M12 5v14M5 12h14',
  leads: 'M4 5.5h16v13H4zM4 6l8 6.5L20 6',
  settings:
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-2.2 1.3l-.3 2h-4l-.3-2a7 7 0 0 1-2.2-1.3l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-3l-1.6-1.2 2-3.4 1.9.7a7 7 0 0 1 2.2-1.3l.3-2h4l.3 2a7 7 0 0 1 2.2 1.3l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 3z',
  about: 'M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20a7 7 0 0 1 14 0',
  web: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5z',
  logout: 'M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14M10 8l-4 4 4 4M6 12h10',
  lock: 'M6.5 10.5h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5',
  chat: 'M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5z',
} as const;

export type BottomNavIcon = keyof typeof ICONS;

export function NavIcon({ name }: { name: BottomNavIcon }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d={ICONS[name]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface BottomNavItem {
  href: string;
  label: string;
  icon: BottomNavIcon;
  /** Activo si la ruta actual coincide exactamente (por defecto, por prefijo). */
  exact?: boolean;
}

export interface BottomSheetAction {
  label: string;
  icon: BottomNavIcon;
  href?: string;
  /** Enlace externo (WhatsApp): se abre en otra pestana. */
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function isActive(pathname: string, item: BottomNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Barra de navegacion inferior al estilo de una app Android (solo en
 * movil/tablet, ver `.bottom-nav` en globals.css). El ultimo boton abre una
 * hoja inferior con el resto de opciones.
 */
export function BottomNav({
  items,
  moreActions,
  moreTitle,
  ariaLabel,
}: {
  items: BottomNavItem[];
  moreActions: BottomSheetAction[];
  moreTitle: ReactNode;
  ariaLabel: string;
}) {
  const pathname = usePathname() ?? '/';
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('has-sheet-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('has-sheet-open');
    };
  }, [moreOpen]);

  return (
    <>
      <nav className="bottom-nav" aria-label={ariaLabel}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'is-active' : undefined}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <span className="bottom-nav-icon">
                <NavIcon name={item.icon} />
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={moreOpen ? 'is-active' : undefined}
          aria-expanded={moreOpen}
          aria-label="Más opciones"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span className="bottom-nav-icon">
            <NavIcon name="more" />
          </span>
          <span className="bottom-nav-label">Más</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => setMoreOpen(false)} aria-hidden="true" />
          <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Más opciones">
            <span className="bottom-sheet-handle" aria-hidden="true" />
            <div className="bottom-sheet-title">{moreTitle}</div>
            <ul className="bottom-sheet-list">
              {moreActions.map((action) => (
                <li key={action.label}>
                  {action.href ? (
                    action.external ? (
                      <a href={action.href} target="_blank" rel="noopener noreferrer">
                        <NavIcon name={action.icon} />
                        {action.label}
                      </a>
                    ) : (
                      <Link href={action.href} onClick={() => setMoreOpen(false)}>
                        <NavIcon name={action.icon} />
                        {action.label}
                      </Link>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={action.disabled}
                      onClick={() => {
                        setMoreOpen(false);
                        action.onClick?.();
                      }}
                    >
                      <NavIcon name={action.icon} />
                      {action.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
