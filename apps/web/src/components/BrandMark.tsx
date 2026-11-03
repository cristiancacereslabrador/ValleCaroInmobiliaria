// Monograma LVG. Mismo trazado que scripts/brand-logo.mjs (fuente de los
// iconos PNG de la PWA): si se cambia uno, regenerar con
// `node scripts/generate-brand-icons.mjs`.
const LETTERS_PATH =
  'M100 168 V344 H170 M194 168 L240 344 L286 168 M411.6 199.4 A53 88 0 1 0 424 276 V260 H378';

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <rect width="512" height="512" rx="116" fill="#121212" />
      <g transform="translate(-6 0)">
        <path
          d={LETTERS_PATH}
          fill="none"
          stroke="#BEAF87"
          strokeWidth="28"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit="2.5"
        />
        <rect x="100" y="384" width="324" height="6" fill="#BEAF87" fillOpacity="0.7" />
      </g>
    </svg>
  );
}
