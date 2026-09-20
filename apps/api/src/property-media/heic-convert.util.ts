import * as path from 'node:path';

// heic-convert 1.x is CommonJS; require avoids ESM default-interop issues in Nest.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const convertHeic = require('heic-convert') as (options: {
  buffer: Buffer;
  format: 'JPEG' | 'PNG';
  quality?: number;
}) => Promise<Buffer | Uint8Array>;

const HEIC_EXTENSIONS = new Set(['.heic', '.heif', '.heics']);
const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

export function isHeicUpload(file: { originalname: string; mimetype: string }): boolean {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  return HEIC_EXTENSIONS.has(extension) || HEIC_MIME_TYPES.has(mime);
}

export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const output = await convertHeic({
    buffer,
    format: 'JPEG',
    quality: 0.86,
  });

  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}
