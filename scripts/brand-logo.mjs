// Logo LVG "Techo amplio": casita con los Andes detras. Fuente unica del
// logo: generate-brand-icons.mjs genera desde aqui los iconos de la PWA, el
// favicon y public/brand/logo-lvg.svg (que usa la cabecera, BrandMark.tsx).

export const GOLD = '#BEAF87';
export const CREAM = '#F3EBD8';
export const INK = '#121212';

// Trazos como lineas (no texto) para que se vean igual en cualquier sistema.
const L = 'M164 344 H100 V168';
const V = 'M186 168 L230 344 L274 168';
// G cuadrada: su lado derecho hace de pared derecha de la casa.
const G = 'M424 168 H332 V344 H424 V262 H382';
// Techo amplio, separado de las letras, con ventana bajo la cumbre.
const ROOF = 'M60 132 L262 14 L464 132';
const WINDOW = 'M245 58 H279 V90 H245 Z M262 58 V90 M245 74 H279';
const ANDES = 'M-60 170 L40 70 L110 120 L170 30 L240 90 M290 80 L350 30 L392 60 L440 4 L560 120';
// Las montanas solo se ven por encima de la prolongacion del techo.
const SKY = 'M-80 -80 H600 V222 L438 124 L262 20 L86 124 L-80 222 Z';

const line = (d, color, width, { round = true, miter = 4 } = {}) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="${round ? 'round' : 'butt'}" stroke-linejoin="${round ? 'round' : 'miter'}" stroke-miterlimit="${miter}"/>`;

/**
 * @param {{ size?: number, variant?: 'any' | 'maskable' }} options
 * `maskable` llena todo el cuadrado (Android recorta la forma); `any` lleva
 * las esquinas redondeadas.
 */
export function logoSvg({ size = 512, variant = 'any' } = {}) {
  const rx = variant === 'maskable' ? 0 : 116;
  const art =
    `<clipPath id="lvg-sky"><path d="${SKY}"/></clipPath>` +
    `<g clip-path="url(#lvg-sky)">${line(ANDES, GOLD, 16)}</g>` +
    line(ROOF, INK, 46) +
    line(ROOF, CREAM, 22) +
    line(WINDOW, CREAM, 7, { round: false }) +
    line(L, CREAM, 34) +
    line(V, CREAM, 34, { miter: 1 }) +
    line(G, CREAM, 34);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-label="LVG">
  <defs><clipPath id="lvg-tile"><rect width="512" height="512" rx="${rx}"/></clipPath></defs>
  <g clip-path="url(#lvg-tile)">
    <rect width="512" height="512" fill="${INK}"/>
    <g transform="translate(256 262) scale(0.8) translate(-262 -186)">${art}</g>
  </g>
</svg>
`;
}
