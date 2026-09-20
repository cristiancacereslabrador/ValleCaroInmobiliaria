import type { ReactNode } from 'react';
import { buildWhatsAppLink, socialHref, socialLabel } from '../lib/format';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.2 8.5V6.8c0-.7.5-1.1 1.2-1.1h1.1V3.2h-2.2c-2.4 0-4 1.5-4 4.1v1.2H8.3V11h2v9.8h3.2V11h2.2l.5-2.5h-2.7z"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.2 3.2h2.2c.2 1.8 1.3 3.4 3.1 4.2v2.3c-1.1 0-2.1-.3-3.1-.9v6.2c0 3.2-2.6 5.8-5.9 5.8S4.6 18.2 4.6 15c0-3.2 2.6-5.8 5.9-5.8.3 0 .6 0 .9.1v2.5c-.3-.1-.6-.2-.9-.2-1.8 0-3.3 1.5-3.3 3.4s1.5 3.4 3.3 3.4 3.3-1.5 3.3-3.4V3.2z"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 3.2A8.7 8.7 0 0 0 3.4 11.9c0 1.53.4 3.02 1.16 4.34L3.2 20.8l4.7-1.32A8.7 8.7 0 0 0 12.04 20.6 8.7 8.7 0 0 0 20.8 11.9 8.7 8.7 0 0 0 12.04 3.2zm0 15.86c-1.4 0-2.76-.38-3.94-1.1l-.28-.17-2.79.78.8-2.72-.18-.3a7.2 7.2 0 0 1-1.1-3.85 7.22 7.22 0 0 1 7.49-7.2 7.22 7.22 0 0 1 7.2 7.49 7.22 7.22 0 0 1-7.2 7.07zm4.15-5.4c-.23-.11-1.34-.66-1.55-.73-.21-.08-.36-.11-.51.11-.15.23-.58.73-.71.88-.13.15-.26.17-.49.06-.23-.11-.96-.35-1.83-1.13-.68-.6-1.13-1.35-1.27-1.58-.13-.23-.01-.35.1-.46.1-.1.23-.26.34-.4.11-.13.15-.23.23-.38.08-.15.04-.28-.02-.4-.06-.11-.51-1.23-.7-1.68-.18-.44-.37-.38-.51-.39h-.43c-.15 0-.4.06-.6.28-.21.23-.8.78-.8 1.9 0 1.12.82 2.2.93 2.35.11.15 1.62 2.47 3.92 3.46.55.24.97.38 1.3.48.55.18 1.04.15 1.43.09.44-.07 1.34-.55 1.53-1.08.19-.53.19-.98.13-1.08-.05-.09-.21-.15-.44-.26z"
      />
    </svg>
  );
}

export function SocialLinks({
  instagram,
  facebook,
  tiktok,
  whatsapp,
  whatsappMessage,
}: {
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  whatsapp?: string | null;
  whatsappMessage?: string;
}) {
  const items = [
    instagram
      ? {
          key: 'instagram',
          href: socialHref('instagram', instagram),
          label: socialLabel('instagram', instagram),
          icon: <InstagramIcon />,
        }
      : null,
    facebook
      ? {
          key: 'facebook',
          href: socialHref('facebook', facebook),
          label: socialLabel('facebook', facebook),
          icon: <FacebookIcon />,
        }
      : null,
    tiktok
      ? {
          key: 'tiktok',
          href: socialHref('tiktok', tiktok),
          label: socialLabel('tiktok', tiktok),
          icon: <TikTokIcon />,
        }
      : null,
    whatsapp
      ? {
          key: 'whatsapp',
          href: buildWhatsAppLink(whatsapp, whatsappMessage || 'Hola'),
          label: 'WhatsApp',
          icon: <WhatsAppIcon />,
        }
      : null,
  ].filter(Boolean) as { key: string; href: string; label: string; icon: ReactNode }[];

  if (items.length === 0) return null;

  return (
    <nav className="social-links" aria-label="Redes sociales">
      {items.map((item) => (
        <a key={item.key} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} title={item.label}>
          {item.icon}
        </a>
      ))}
    </nav>
  );
}
