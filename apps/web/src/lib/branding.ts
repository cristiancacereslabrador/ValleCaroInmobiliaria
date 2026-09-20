export const FALLBACK_PORTAL_NAME = 'Portal de captaciones';
export const FALLBACK_PORTAL_SLOGAN = 'Portal de captaciones en San Cristóbal, Táchira';
export const FALLBACK_PORTAL_LEGAL = 'Portal de captaciones · San Cristóbal, Táchira';
export const FALLBACK_ABOUT_TEXT =
  'Portal de captaciones en San Cristóbal, Táchira. Publicamos inmuebles con acceso de la asesora y de quien ella autorice.';

export const COLOR_PRESETS = [
  { id: 'c21', label: 'Dorado y negro (Century 21)', primary: '#BEAF87', secondary: '#121212' },
  { id: 'oro', label: 'Dorado oscuro', primary: '#746649', secondary: '#121212' },
  { id: 'fucsia', label: 'Fucsia y morado', primary: '#E11D8A', secondary: '#6D28D9' },
  { id: 'verde', label: 'Verde', primary: '#1f6f5c', secondary: '#16543f' },
] as const;

export const DEFAULT_PRIMARY_COLOR = COLOR_PRESETS[0].primary;
export const DEFAULT_SECONDARY_COLOR = COLOR_PRESETS[0].secondary;
