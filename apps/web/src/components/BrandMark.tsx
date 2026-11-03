// Logo LVG. El archivo lo genera `node scripts/generate-brand-icons.mjs`
// desde scripts/brand-logo.mjs, junto con los iconos de la PWA.
export function BrandMark({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logo-lvg.svg" alt="" aria-hidden="true" className={className} />;
}
