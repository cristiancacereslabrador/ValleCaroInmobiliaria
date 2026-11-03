import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import sharp = require('sharp');

/**
 * Sirve versiones reducidas de las fotos de propiedades:
 * `/media/w/<ancho>/properties/<propertyId>/<archivo>`.
 *
 * Las fotos originales miden hasta 1920 px y ~400 KB; una tarjeta del
 * catalogo las muestra a ~300 px. En movil eso hacia descargar decenas de MB
 * por pagina. La variante se genera la primera vez que se pide (WebP) y se
 * guarda en disco junto a los originales, asi que las fotos ya subidas
 * tambien se benefician sin migracion.
 */
export const IMAGE_VARIANT_WIDTHS = [320, 640, 1080, 1600] as const;

const ROUTE = /^\/(\d+)\/properties\/([0-9a-f-]{36})\/([0-9a-f-]{36}\.(?:jpe?g|png|webp))$/i;
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export function createImageVariantsHandler(storageRoot: string) {
  const variantsRoot = path.join(storageRoot, '..', 'variants');
  const inFlight = new Map<string, Promise<void>>();

  async function ensureVariant(source: string, target: string, width: number): Promise<void> {
    try {
      await fs.access(target);
      return;
    } catch {
      // Todavia no existe: se genera abajo.
    }

    let pending = inFlight.get(target);
    if (!pending) {
      pending = (async () => {
        await fs.mkdir(path.dirname(target), { recursive: true });
        const tmp = `${target}.${process.pid}.tmp`;
        await sharp(source, { failOn: 'none' })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 72 })
          .toFile(tmp);
        await fs.rename(tmp, target);
      })().finally(() => inFlight.delete(target));
      inFlight.set(target, pending);
    }
    await pending;
  }

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    const match = ROUTE.exec(req.path);
    const width = match ? Number(match[1]) : NaN;
    if (!match || !(IMAGE_VARIANT_WIDTHS as readonly number[]).includes(width)) {
      res.status(404).end();
      return;
    }

    const [, , propertyId, filename] = match;
    const source = path.join(storageRoot, propertyId, filename);
    const target = path.join(variantsRoot, String(width), propertyId, `${filename}.webp`);

    try {
      await ensureVariant(source, target, width);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        res.status(404).end();
        return;
      }
      // Si la foto no se puede procesar se sirve el original tal cual.
      res.sendFile(source, { maxAge: ONE_YEAR_SECONDS * 1000, immutable: true }, (err) => {
        if (err && !res.headersSent) res.status(404).end();
      });
      return;
    }

    res.type('image/webp');
    res.sendFile(target, { maxAge: ONE_YEAR_SECONDS * 1000, immutable: true }, (err) => {
      if (err && !res.headersSent) res.status(404).end();
    });
  };
}
