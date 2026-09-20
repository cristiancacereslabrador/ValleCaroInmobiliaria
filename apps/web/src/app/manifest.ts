import type { MetadataRoute } from 'next';
import { DEFAULT_PRIMARY_COLOR, FALLBACK_PORTAL_NAME, FALLBACK_PORTAL_SLOGAN } from '../lib/branding';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: FALLBACK_PORTAL_NAME,
    short_name: 'Captaciones',
    description: FALLBACK_PORTAL_SLOGAN,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f7efe0',
    theme_color: DEFAULT_PRIMARY_COLOR,
    lang: 'es-VE',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
