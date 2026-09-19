'use client';

import { useEffect, useRef } from 'react';

interface PannellumViewerInstance {
  destroy(): void;
}

interface PannellumGlobal {
  viewer(
    container: HTMLElement,
    config: {
      type: 'equirectangular';
      panorama: string;
      autoLoad?: boolean;
      showZoomCtrl?: boolean;
      compass?: boolean;
    },
  ): PannellumViewerInstance;
}

interface PanoramaViewerProps {
  imageUrl: string;
}

/**
 * Visor interactivo de un tour virtual 360 (property-virtual-tours -
 * tasks.md 2.1, design.md - Decision 2): envuelve la libreria vanilla
 * Pannellum, que permite rotar (arrastrar) y hacer zoom (rueda/controles)
 * sobre una imagen panoramica equirectangular.
 *
 * Pannellum (`node_modules/pannellum/build/pannellum.js`) no es un modulo
 * ES/CommonJS - al cargarse asigna `window.pannellum` directamente y hace
 * referencia a `window`/`document` en el cuerpo del script, por lo que no
 * es compatible con el renderizado en servidor de Next.js. Se importa de
 * forma dinamica dentro de `useEffect`, que solo se ejecuta en el
 * navegador, en vez de con un `import` estatico arriba del archivo.
 */
export function PanoramaViewer({ imageUrl }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let viewerInstance: PannellumViewerInstance | null = null;

    import('pannellum').then(() => {
      if (cancelled || !containerRef.current) return;

      const pannellum = (window as unknown as { pannellum: PannellumGlobal }).pannellum;
      viewerInstance = pannellum.viewer(containerRef.current, {
        type: 'equirectangular',
        panorama: imageUrl,
        autoLoad: true,
        showZoomCtrl: true,
        compass: false,
      });
    });

    return () => {
      cancelled = true;
      viewerInstance?.destroy();
    };
  }, [imageUrl]);

  return <div ref={containerRef} className="panorama-viewer" />;
}
