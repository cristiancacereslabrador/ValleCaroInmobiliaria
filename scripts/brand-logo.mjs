// Monograma LVG (dorado sobre negro). Fuente unica del logo: la usan
// generate-brand-icons.mjs (iconos PNG de la PWA y favicon) y, copiado como
// JSX, apps/web/src/components/BrandMark.tsx.

export const GOLD = '#BEAF87';
export const INK = '#121212';

// Letras trazadas como lineas (no texto) para que se vean igual en cualquier
// sistema, sin depender de fuentes instaladas. Caja de 512x512, letras
// dentro de la zona segura de los iconos "maskable" (circulo de r=205).
export const LETTERS_PATH = [
  // L
  'M100 168 V344 H170',
  // V
  'M194 168 L240 344 L286 168',
  // G
  'M411.6 199.4 A53 88 0 1 0 424 276 V260 H378',
].join(' ');

export const STROKE_WIDTH = 28;

export function logoSvg({ size = 512, variant = 'any' } = {}) {
  const background =
    variant === 'maskable'
      ? `<rect width="512" height="512" fill="${INK}"/>`
      : `<rect width="512" height="512" rx="116" fill="${INK}"/>
  <rect x="34" y="34" width="444" height="444" rx="88" fill="none" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="5"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-label="LVG">
  ${background}
  <g transform="translate(-6 0)">
  <path d="${LETTERS_PATH}" fill="none" stroke="${GOLD}" stroke-width="${STROKE_WIDTH}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="2.5"/>
  <rect x="100" y="384" width="324" height="6" fill="${GOLD}" fill-opacity="0.7"/>
  </g>
</svg>
`;
}
