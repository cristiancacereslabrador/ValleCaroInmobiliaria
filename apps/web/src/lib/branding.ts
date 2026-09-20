export const FALLBACK_PORTAL_NAME = 'Portal de captaciones';
export const FALLBACK_PORTAL_SLOGAN = 'Portal de captaciones en San Cristóbal, Táchira';
export const FALLBACK_PORTAL_LEGAL = 'Portal de captaciones · San Cristóbal, Táchira';
export const FALLBACK_ABOUT_TEXT =
  'Portal de captaciones en San Cristóbal, Táchira. Publicamos inmuebles con acceso de la asesora y de quien ella autorice.';

export const COLOR_PRESETS = [
  { id: 'fucsia', label: 'Fucsia y morado (principal)', primary: '#E11D8A', secondary: '#6D28D9' },
  { id: 'ciruela', label: 'Fucsia y ciruela', primary: '#C026D3', secondary: '#701A75' },
  { id: 'violeta', label: 'Morado y lila', primary: '#7C3AED', secondary: '#4C1D95' },
  { id: 'verde', label: 'Verde', primary: '#1f6f5c', secondary: '#16543f' },
  { id: 'oro', label: 'Dorado y negro', primary: '#C5A572', secondary: '#111111' },
] as const;

export const DEFAULT_PRIMARY_COLOR = COLOR_PRESETS[0].primary;
export const DEFAULT_SECONDARY_COLOR = COLOR_PRESETS[0].secondary;
