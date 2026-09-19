import type { Metadata } from 'next';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import './globals.css';
// Estilos base del visor Pannellum (property-virtual-tours - tasks.md 2.1):
// controles de zoom/rotacion, mensajes de carga, etc. Se importa aqui (root
// layout) porque el App Router de Next.js solo admite CSS global desde un
// archivo de layout/pagina, no desde un componente de cliente cualquiera.
import 'pannellum/build/pannellum.css';
import { SiteChrome } from '../components/SiteChrome';
import { getBrokerSettings } from '../lib/api/brokerSettings';

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
    const title = settings.businessName?.trim() || 'Inmobiliaria';
    return {
      title,
      description: settings.slogan?.trim() || 'Inmobiliaria en San Cristóbal, Táchira',
    };
  } catch {
    return {
      title: 'Inmobiliaria',
      description: 'Inmobiliaria en San Cristóbal, Táchira',
    };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" className={`${outfit.variable} ${cormorant.variable}`}>
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
