import { pickCoverPhotoUrl } from './cover-photo.util';
import { MediaType } from './entities/media-type.enum';
import { PropertyMedia } from './entities/property-media.entity';

function media(overrides: Partial<PropertyMedia>): PropertyMedia {
  return {
    id: 'media-id',
    propertyId: 'property-id',
    type: MediaType.PHOTO,
    url: '/media/properties/property-id/default.jpg',
    isCover: false,
    position: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as PropertyMedia;
}

describe('pickCoverPhotoUrl (property-media spec - Requirement "Foto de portada de la propiedad")', () => {
  it('Scenario "Designar foto de portada": devuelve la foto marcada explicitamente como portada', () => {
    const photos = [
      media({ id: '1', url: '/a.jpg', position: 0, isCover: false }),
      media({ id: '2', url: '/b.jpg', position: 1, isCover: true }),
      media({ id: '3', url: '/c.jpg', position: 2, isCover: false }),
    ];

    expect(pickCoverPhotoUrl(photos)).toBe('/b.jpg');
  });

  it('Scenario "Propiedad sin foto de portada asignada": usa la primera foto cargada como portada por defecto', () => {
    const photos = [
      media({ id: '1', url: '/first.jpg', position: 0, isCover: false }),
      media({ id: '2', url: '/second.jpg', position: 1, isCover: false }),
    ];

    expect(pickCoverPhotoUrl(photos)).toBe('/first.jpg');
  });

  it('ignora videos al calcular la portada por defecto', () => {
    const media_ = [
      media({ id: 'v1', type: MediaType.VIDEO, url: '/video.mp4', position: 0 }),
      media({ id: 'p1', type: MediaType.PHOTO, url: '/photo.jpg', position: 1 }),
    ];

    expect(pickCoverPhotoUrl(media_)).toBe('/photo.jpg');
  });

  it('devuelve null cuando la propiedad no tiene fotos', () => {
    expect(pickCoverPhotoUrl([])).toBeNull();
    expect(pickCoverPhotoUrl(undefined)).toBeNull();
  });
});
