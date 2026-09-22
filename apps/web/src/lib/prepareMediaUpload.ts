const MAX_EDGE = 1920;
const JPEG_QUALITY = 0.82;
const COMPRESS_IF_OVER_BYTES = 900_000;

function baseName(file: File): string {
  const raw = (file.name || 'foto').replace(/\.[^.]+$/, '');
  return raw.trim() || 'foto';
}

function withName(file: File, filename: string, type = file.type): File {
  if (file.name === filename && (!type || file.type === type)) return file;
  return new File([file], filename, { type: type || file.type, lastModified: file.lastModified });
}

function isHeicLike(file: File): boolean {
  return /\.hei[cf]s?$/i.test(file.name) || /heic|heif/i.test(file.type);
}

function isRasterImage(file: File): boolean {
  if (isHeicLike(file)) return false;
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
}

function isVideo(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  return /\.(mp4|webm|mov|m4v|3gp)$/i.test(file.name);
}

/** Android a veces manda el archivo sin nombre o con MIME raro (`image/jpg`). */
export function normalizePickedFile(file: File): File {
  if (isHeicLike(file)) {
    const name = /\.hei[cf]s?$/i.test(file.name) ? file.name : `${baseName(file)}.heic`;
    return withName(file, name, file.type || 'image/heic');
  }
  if (isRasterImage(file)) {
    const name = /\.(jpe?g|png|webp)$/i.test(file.name) ? file.name : `${baseName(file)}.jpg`;
    const type =
      file.type === 'image/jpg' || file.type === 'image/pjpeg' || !file.type
        ? 'image/jpeg'
        : file.type;
    return withName(file, name, type);
  }
  if (isVideo(file)) {
    const name = /\.(mp4|webm|mov|m4v)$/i.test(file.name) ? file.name : `${baseName(file)}.mp4`;
    return withName(file, name, file.type || 'video/mp4');
  }
  if (!file.name) {
    return withName(file, 'archivo');
  }
  return file;
}

export async function prepareMediaFile(file: File): Promise<File> {
  const normalized = normalizePickedFile(file);
  if (!isRasterImage(normalized) || isHeicLike(normalized)) {
    return normalized;
  }
  if (normalized.size <= COMPRESS_IF_OVER_BYTES && typeof createImageBitmap !== 'function') {
    return normalized;
  }

  try {
    const bitmap = await createImageBitmap(normalized);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    if (scale === 1 && normalized.size <= COMPRESS_IF_OVER_BYTES && normalized.type === 'image/jpeg') {
      bitmap.close();
      return normalized;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return normalized;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
    });
    if (!blob || blob.size === 0) return normalized;

    return new File([blob], `${baseName(normalized)}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return normalized;
  }
}
