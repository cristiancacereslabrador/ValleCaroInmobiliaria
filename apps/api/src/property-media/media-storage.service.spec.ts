import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { MediaStorageService } from './media-storage.service';

describe('MediaStorageService', () => {
  let service: MediaStorageService;
  let tempStorageRoot: string;

  beforeEach(async () => {
    tempStorageRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'media-storage-test-'));

    const configService = {
      get: jest.fn().mockReturnValue(tempStorageRoot),
    } as unknown as ConfigService;

    service = new MediaStorageService(configService);
  });

  afterEach(async () => {
    await fs.rm(tempStorageRoot, { recursive: true, force: true });
  });

  it('guarda un archivo en el filesystem bajo storage/properties/<property_id>/ y devuelve la url publica', async () => {
    const propertyId = 'property-123';
    const file = { originalname: 'photo.jpg', buffer: Buffer.from('fake-image-bytes') };

    const url = await service.saveFile(propertyId, file);

    expect(url).toMatch(/^\/media\/properties\/property-123\/[0-9a-f-]+\.jpg$/);

    const storedFilename = path.basename(url);
    const storedPath = path.join(tempStorageRoot, propertyId, storedFilename);
    const contents = await fs.readFile(storedPath);
    expect(contents.toString()).toBe('fake-image-bytes');
  });

  it('permite guardar varios archivos para la misma propiedad sin sobrescribirse', async () => {
    const propertyId = 'property-123';

    const url1 = await service.saveFile(propertyId, {
      originalname: 'a.jpg',
      buffer: Buffer.from('one'),
    });
    const url2 = await service.saveFile(propertyId, {
      originalname: 'b.jpg',
      buffer: Buffer.from('two'),
    });

    expect(url1).not.toBe(url2);

    const files = await fs.readdir(path.join(tempStorageRoot, propertyId));
    expect(files).toHaveLength(2);
  });

  it('elimina un archivo previamente guardado', async () => {
    const propertyId = 'property-123';
    const url = await service.saveFile(propertyId, {
      originalname: 'to-delete.png',
      buffer: Buffer.from('data'),
    });
    const storedPath = path.join(tempStorageRoot, propertyId, path.basename(url));

    await expect(fs.access(storedPath)).resolves.toBeUndefined();

    await service.deleteFile(url);

    await expect(fs.access(storedPath)).rejects.toThrow();
  });

  it('no lanza error al eliminar un archivo que ya no existe', async () => {
    await expect(
      service.deleteFile('/media/properties/property-123/does-not-exist.jpg'),
    ).resolves.toBeUndefined();
  });
});
