import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyMediaService } from './property-media.service';
import { PropertyMedia } from './entities/property-media.entity';
import { MediaType } from './entities/media-type.enum';
import { MediaStorageService } from './media-storage.service';
import { PropertiesService } from '../properties/properties.service';
import { convertHeicToJpeg, isHeicUpload } from './heic-convert.util';

jest.mock('./heic-convert.util', () => ({
  isHeicUpload: jest.fn(
    (file: { originalname: string; mimetype: string }) =>
      /\.hei[cf]s?$/i.test(file.originalname) || /heic|heif/i.test(file.mimetype),
  ),
  convertHeicToJpeg: jest.fn(async (buffer: Buffer) => buffer),
}));

describe('PropertyMediaService', () => {
  let service: PropertyMediaService;
  let repository: jest.Mocked<Repository<PropertyMedia>>;
  let mediaStorageService: { saveFile: jest.Mock; deleteFile: jest.Mock };
  let propertiesService: { findOne: jest.Mock };
  let configService: { get: jest.Mock };

  const propertyId = 'property-id';

  const baseImageFile = {
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('fake'),
  };

  beforeEach(async () => {
    mediaStorageService = {
      saveFile: jest.fn().mockResolvedValue('/media/properties/property-id/generated.jpg'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    propertiesService = { findOne: jest.fn().mockResolvedValue({ id: propertyId }) };
    configService = {
      get: jest.fn((key: string, def: unknown) => def),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyMediaService,
        {
          provide: getRepositoryToken(PropertyMedia),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: 'generated-media-id', ...data })),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
          },
        },
        { provide: MediaStorageService, useValue: mediaStorageService },
        { provide: PropertiesService, useValue: propertiesService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(PropertyMediaService);
    repository = module.get(getRepositoryToken(PropertyMedia));
  });

  describe('uploadMedia (4.2)', () => {
    it('rechaza la subida si la propiedad no existe', async () => {
      propertiesService.findOne.mockRejectedValue(new NotFoundException('not found'));

      await expect(service.uploadMedia(propertyId, baseImageFile)).rejects.toThrow(
        NotFoundException,
      );
      expect(mediaStorageService.saveFile).not.toHaveBeenCalled();
    });

    it('acepta foto de Android sin extensión y MIME genérico si el contenido es JPEG', async () => {
      const file = {
        originalname: '',
        mimetype: 'application/octet-stream',
        size: 12,
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
      };

      const result = await service.uploadMedia(propertyId, file);

      expect(result).toMatchObject({ type: MediaType.PHOTO });
      expect(mediaStorageService.saveFile).toHaveBeenCalledWith(
        propertyId,
        expect.objectContaining({ originalname: 'foto.jpg', mimetype: 'image/jpeg' }),
      );
    });

    it('acepta el MIME image/jpg que envían algunos Android', async () => {
      const file = { ...baseImageFile, originalname: 'image', mimetype: 'image/jpg' };

      const result = await service.uploadMedia(propertyId, file);

      expect(result).toMatchObject({ type: MediaType.PHOTO });
    });

    it('acepta un formato de video soportado (mp4)', async () => {
      const file = { ...baseImageFile, originalname: 'clip.mp4', mimetype: 'video/mp4' };

      const result = await service.uploadMedia(propertyId, file);

      expect(result).toMatchObject({ type: MediaType.VIDEO });
    });

    it('acepta video MOV de iPhone', async () => {
      const file = { ...baseImageFile, originalname: 'clip.mov', mimetype: 'video/quicktime' };

      const result = await service.uploadMedia(propertyId, file);

      expect(result).toMatchObject({ type: MediaType.VIDEO });
    });

    it('convierte HEIC a JPEG antes de guardar', async () => {
      const jpegBuffer = Buffer.from('jpeg');
      (isHeicUpload as jest.Mock).mockReturnValueOnce(true);
      (convertHeicToJpeg as jest.Mock).mockResolvedValueOnce(jpegBuffer);
      const file = { ...baseImageFile, originalname: 'IMG_1.heic', mimetype: 'image/heic' };

      const result = await service.uploadMedia(propertyId, file);

      expect(result).toMatchObject({ type: MediaType.PHOTO });
      expect(mediaStorageService.saveFile).toHaveBeenCalledWith(
        propertyId,
        expect.objectContaining({
          originalname: 'IMG_1.jpg',
          mimetype: 'image/jpeg',
          buffer: jpegBuffer,
        }),
      );
    });

    it('rechaza un formato no soportado', async () => {
      const file = { ...baseImageFile, originalname: 'document.pdf', mimetype: 'application/pdf' };

      await expect(service.uploadMedia(propertyId, file)).rejects.toThrow(BadRequestException);
      expect(mediaStorageService.saveFile).not.toHaveBeenCalled();
    });

    it('rechaza una imagen que excede el tamano maximo configurado', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'MEDIA_MAX_IMAGE_SIZE_MB' ? 1 : 100,
      );
      const oversizedFile = { ...baseImageFile, size: 2 * 1024 * 1024 };

      await expect(service.uploadMedia(propertyId, oversizedFile)).rejects.toThrow(
        BadRequestException,
      );
      expect(mediaStorageService.saveFile).not.toHaveBeenCalled();
    });

    it('marca la primera foto cargada como portada por defecto (4.5)', async () => {
      (repository.count as jest.Mock).mockResolvedValue(0);

      const result = await service.uploadMedia(propertyId, baseImageFile);

      expect(result).toMatchObject({ isCover: true });
    });

    it('no marca como portada las fotos siguientes a la primera', async () => {
      (repository.count as jest.Mock).mockResolvedValue(1);

      const result = await service.uploadMedia(propertyId, baseImageFile);

      expect(result).toMatchObject({ isCover: false });
    });
  });

  describe('uploadMedia con tour virtual 360 (property-virtual-tours 1.2)', () => {
    it('acepta una imagen equirectangular como tour360 cuando se pide explicitamente', async () => {
      const result = await service.uploadMedia(propertyId, baseImageFile, 'tour360');

      expect(result).toMatchObject({ type: MediaType.TOUR_360 });
      expect(mediaStorageService.saveFile).toHaveBeenCalledWith(propertyId, baseImageFile);
    });

    it('sin "type" en la peticion, una imagen se sigue subiendo como photo (no se infiere tour360)', async () => {
      const result = await service.uploadMedia(propertyId, baseImageFile);

      expect(result).toMatchObject({ type: MediaType.PHOTO });
    });

    it('rechaza un tour360 con un formato de archivo no soportado (ej. video)', async () => {
      const file = { ...baseImageFile, originalname: 'clip.mp4', mimetype: 'video/mp4' };

      await expect(service.uploadMedia(propertyId, file, 'tour360')).rejects.toThrow(
        BadRequestException,
      );
      expect(mediaStorageService.saveFile).not.toHaveBeenCalled();
    });

    it('un tour360 nunca se marca como portada, aunque sea el primer medio de la propiedad', async () => {
      (repository.count as jest.Mock).mockResolvedValue(0);

      const result = await service.uploadMedia(propertyId, baseImageFile, 'tour360');

      expect(result).toMatchObject({ isCover: false });
    });

    it('un tour360 reutiliza el limite de tamano configurado para imagenes', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'MEDIA_MAX_IMAGE_SIZE_MB' ? 1 : 100,
      );
      const oversizedFile = { ...baseImageFile, size: 2 * 1024 * 1024 };

      await expect(service.uploadMedia(propertyId, oversizedFile, 'tour360')).rejects.toThrow(
        BadRequestException,
      );
      expect(mediaStorageService.saveFile).not.toHaveBeenCalled();
    });

    it('markCover rechaza intentar marcar un tour360 como portada', async () => {
      const existingMedia = {
        id: 'media-1',
        propertyId,
        type: MediaType.TOUR_360,
        isCover: false,
      };
      (repository.findOne as jest.Mock).mockResolvedValue(existingMedia);

      await expect(service.markCover(propertyId, 'media-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllForProperty con tours virtuales', () => {
    it('incluye fotos, videos y tours virtuales en el listado', async () => {
      const items = [
        { id: '1', type: MediaType.PHOTO },
        { id: '2', type: MediaType.VIDEO },
        { id: '3', type: MediaType.TOUR_360 },
      ];
      (repository.find as jest.Mock).mockResolvedValue(items);

      await expect(service.findAllForProperty(propertyId)).resolves.toEqual(items);
    });
  });

  describe('findAllForProperty (4.3)', () => {
    it('devuelve lista vacia cuando la propiedad no tiene medios', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      await expect(service.findAllForProperty(propertyId)).resolves.toEqual([]);
    });

    it('devuelve todos los medios asociados', async () => {
      const items = [{ id: '1' }, { id: '2' }];
      (repository.find as jest.Mock).mockResolvedValue(items);

      await expect(service.findAllForProperty(propertyId)).resolves.toEqual(items);
    });
  });

  describe('remove (4.4)', () => {
    it('elimina el registro y el archivo fisico', async () => {
      const existingMedia = {
        id: 'media-1',
        propertyId,
        url: '/media/properties/property-id/x.jpg',
        isCover: false,
      };
      (repository.findOne as jest.Mock).mockResolvedValue(existingMedia);

      await service.remove(propertyId, 'media-1');

      expect(mediaStorageService.deleteFile).toHaveBeenCalledWith(existingMedia.url);
      expect(repository.delete).toHaveBeenCalledWith('media-1');
    });

    it('devuelve error si el medio no existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(propertyId, 'missing-media')).rejects.toThrow(
        NotFoundException,
      );
      expect(mediaStorageService.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('markCover (4.5)', () => {
    it('marca una foto existente como portada explicita', async () => {
      const existingMedia = {
        id: 'media-1',
        propertyId,
        type: MediaType.PHOTO,
        isCover: false,
      };
      (repository.findOne as jest.Mock).mockResolvedValue(existingMedia);

      const result = await service.markCover(propertyId, 'media-1');

      expect(repository.update).toHaveBeenCalledWith(
        { propertyId, type: MediaType.PHOTO },
        { isCover: false },
      );
      expect(result.isCover).toBe(true);
    });
  });
});
