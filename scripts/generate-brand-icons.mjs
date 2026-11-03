// Genera los iconos de la marca (favicon, PWA, Apple) desde brand-logo.mjs.
// Uso: node scripts/generate-brand-icons.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { logoSvg } from './brand-logo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// sharp vive en el workspace de la API.
const sharp = createRequire(join(root, 'apps/api/package.json'))('sharp');

const web = join(root, 'apps/web');
const outputs = [
  { file: 'public/icons/icon-192.png', size: 192, variant: 'any' },
  { file: 'public/icons/icon-512.png', size: 512, variant: 'any' },
  { file: 'public/icons/icon-maskable-512.png', size: 512, variant: 'maskable' },
  { file: 'src/app/apple-icon.png', size: 180, variant: 'maskable' },
];

writeFileSync(join(web, 'src/app/icon.svg'), logoSvg({ size: 64 }));

for (const { file, size, variant } of outputs) {
  await sharp(Buffer.from(logoSvg({ size: 512, variant })), { density: 72 * (size / 512) * 4 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(web, file));
  console.log('ok', file);
}
