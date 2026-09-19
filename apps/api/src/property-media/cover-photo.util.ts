import { PropertyMedia } from './entities/property-media.entity';
import { MediaType } from './entities/media-type.enum';

/**
 * property-media spec, Requirement "Foto de portada de la propiedad":
 * - Si una foto esta marcada explicitamente como portada (`isCover`), esa es
 *   la portada.
 * - Si la propiedad tiene fotos pero ninguna marcada, se usa la primera foto
 *   cargada (por `position` y, en caso de empate, por `createdAt`) como
 *   portada por defecto.
 * - Los videos nunca se consideran portada.
 *
 * Funcion pura y sin dependencias de Nest/TypeORM para poder reutilizarse
 * tanto desde `property-media` (al marcar portada) como desde
 * `property-catalog` (al construir la respuesta de listado/detalle de una
 * propiedad) sin crear una dependencia circular entre ambos modulos.
 */
export function pickCoverPhotoUrl(media: PropertyMedia[] = []): string | null {
  const photos = media.filter((item) => item.type === MediaType.PHOTO);

  if (photos.length === 0) {
    return null;
  }

  const explicitCover = photos.find((photo) => photo.isCover);
  if (explicitCover) {
    return explicitCover.url;
  }

  const sortedByUploadOrder = [...photos].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return sortedByUploadOrder[0].url;
}
