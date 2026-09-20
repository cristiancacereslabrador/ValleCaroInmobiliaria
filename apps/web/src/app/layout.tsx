import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import './globals.css';
import 'pannellum/build/pannellum.css';
import { SiteChrome } from '../components/SiteChrome';
import { PwaRegister } from '../components/PwaRegister';
import { getBrokerSettings } from '../lib/api/brokerSettings';
import { DEFAULT_PRIMARY_COLOR, FALLBACK_PORTAL_NAME, FALLBACK_PORTAL_SLOGAN } from '../lib/branding';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getBrokerSettings();
    const title = settings.businessName?.trim() || FALLBACK_PORTAL_NAME;
    return {
      title,
      description: settings.slogan?.trim() || FALLBACK_PORTAL_SLOGAN,
      applicationName: title,
      appleWebApp: {
        capable: true,
        title,
        statusBarStyle: 'default',
      },
      robots: process.env.NODE_ENV === 'production' ? { index: true, follow: true } : { index: false, follow: false },
    };
  } catch {
    return {
      title: FALLBACK_PORTAL_NAME,
      description: FALLBACK_PORTAL_SLOGAN,
      applicationName: FALLBACK_PORTAL_NAME,
      appleWebApp: {
        capable: true,
        title: FALLBACK_PORTAL_NAME,
        statusBarStyle: 'default',
      },
      robots: process.env.NODE_ENV === 'production' ? { index: true, follow: true } : { index: false, follow: false },
    };
  }
}

export const viewport: Viewport = {
  themeColor: DEFAULT_PRIMARY_COLOR,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" className={`${outfit.variable} ${cormorant.variable}`}>
      <body>
        <PwaRegister />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
