/**
 * `pannellum` (node_modules/pannellum) no publica tipos ni es un modulo
 * ES/CommonJS real - es un script vanilla que asigna `window.pannellum` al
 * cargarse (ver components/PanoramaViewer.tsx). Solo se importa por su
 * efecto secundario (`import('pannellum')`), nunca se usa su export, por lo
 * que basta con declararlo como modulo sin tipos para que `tsc` no falle.
 */
declare module 'pannellum';
