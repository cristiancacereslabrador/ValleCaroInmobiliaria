import * as path from 'node:path';

export interface SniffableFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export type SniffedKind = 'jpeg' | 'png' | 'webp' | 'heic' | 'mp4' | 'webm' | 'unknown';

const GENERIC_MIME_TYPES = new Set([
  '',
  'application/octet-stream',
  'binary/octet-stream',
  'application/download',
]);

const MIME_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-jpeg': 'image/jpeg',
  'image/x-png': 'image/png',
  'image/heic-sequence': 'image/heic',
  'image/heif': 'image/heic',
  'image/heif-sequence': 'image/heic',
};

const KIND_EXTENSION: Record<Exclude<SniffedKind, 'unknown'>, string> = {
  jpeg: '.jpg',
  png: '.png',
  webp: '.webp',
  heic: '.heic',
  mp4: '.mp4',
  webm: '.webm',
};

const KIND_MIME: Record<Exclude<SniffedKind, 'unknown'>, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

export function sniffUploadKind(buffer: Buffer): SniffedKind {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase().replace(/\0/g, '');
    if (['heic', 'heif', 'mif1', 'msf1', 'heix', 'hevc', 'hevx', 'heim', 'heis'].includes(brand)) {
      return 'heic';
    }
    return 'mp4';
  }
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return 'webm';
  }
  return 'unknown';
}

export function applySniffedIdentity(file: SniffableFile, kind: SniffedKind): SniffableFile {
  const incomingMime = (file.mimetype || '').toLowerCase();
  let mimetype = MIME_ALIASES[incomingMime] ?? incomingMime;
  if (
    kind !== 'unknown' &&
    (GENERIC_MIME_TYPES.has(mimetype) ||
      (!mimetype.startsWith('image/') && !mimetype.startsWith('video/')))
  ) {
    mimetype = KIND_MIME[kind];
  }

  const currentExt = path.extname(file.originalname || '').toLowerCase();
  const neededExt = kind === 'unknown' ? currentExt : KIND_EXTENSION[kind];
  const parsedName = path.parse(file.originalname || '').name;
  const fallback = kind === 'mp4' || kind === 'webm' ? 'video' : 'foto';
  const baseName = parsedName || fallback;
  const originalname = neededExt ? `${baseName}${neededExt}` : file.originalname || fallback;

  return {
    ...file,
    originalname,
    mimetype: mimetype || file.mimetype,
  };
}
