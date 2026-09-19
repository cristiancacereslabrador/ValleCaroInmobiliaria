import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPropertyListsService } from './saved-property-lists.service';
import { SavedPropertyList } from './entities/saved-property-list.entity';
import { SavedPropertyListItem } from './entities/saved-property-list-item.entity';
import { Property } from '../properties/entities/property.entity';

describe('SavedPropertyListsService', () => {
  let service: SavedPropertyListsService;
  let listsRepository: jest.Mocked<Repository<SavedPropertyList>>;
  let itemsRepository: jest.Mocked<Repository<SavedPropertyListItem>>;
  let propertiesRepository: jest.Mocked<Repository<Property>>;
  let insertQueryBuilder: {
    insert: jest.Mock;
    into: jest.Mock;
    values: jest.Mock;
    orIgnore: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(async () => {
    insertQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ raw: {} }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedPropertyListsService,
        {
          provide: getRepositoryToken(SavedPropertyList),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: 'list-id', ...data })),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SavedPropertyListItem),
          useValue: {
            createQueryBuilder: jest.fn(() => insertQueryBuilder),
            delete: jest.fn().mockResolvedValue({ affected: 1, raw: {} }),
          },
        },
        {
          provide: getRepositoryToken(Property),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SavedPropertyListsService);
    listsRepository = module.get(getRepositoryToken(SavedPropertyList));
    itemsRepository = module.get(getRepositoryToken(SavedPropertyListItem));
    propertiesRepository = module.get(getRepositoryToken(Property));
  });

  describe('create (2.1)', () => {
    it('crea una lista vacia con managementToken y shareToken distintos', async () => {
      const result = await service.create({ name: 'TOP 3' });

      expect(result.name).toBe('TOP 3');
      expect(result.properties).toEqual([]);
      expect(result.managementToken).toBeDefined();
      expect(result.shareToken).toBeDefined();
      expect(result.managementToken).not.toBe(result.shareToken);
      expect(listsRepository.save).toHaveBeenCalled();
    });
  });

  describe('findByManagementToken (2.3)', () => {
    it('devuelve nombre, propiedades y ambos identificadores con un token de gestion valido', async () => {
      const property = { id: 'prop-1', media: [] } as unknown as Property;
      const list = {
        id: 'list-id',
        name: 'TOP 3',
        managementToken: 'mgmt-token',
        shareToken: 'share-token',
        items: [{ property }],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as SavedPropertyList;
      (listsRepository.findOne as jest.Mock).mockResolvedValue(list);

      const result = await service.findByManagementToken('mgmt-token');

      expect(result).toMatchObject({
        name: 'TOP 3',
        managementToken: 'mgmt-token',
        shareToken: 'share-token',
      });
      expect(result.properties).toHaveLength(1);
    });

    it('rechaza un identificador de gestion que no corresponde a ninguna lista', async () => {
      (listsRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findByManagementToken('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByShareToken (2.3)', () => {
    it('devuelve nombre y propiedades sin exponer el managementToken', async () => {
      const property = { id: 'prop-1', media: [] } as unknown as Property;
      const list = {
        id: 'list-id',
        name: 'Con terraza',
        managementToken: 'secret-mgmt-token',
        shareToken: 'share-token',
        items: [{ property }],
      } as unknown as SavedPropertyList;
      (listsRepository.findOne as jest.Mock).mockResolvedValue(list);

      const result = await service.findByShareToken('share-token');

      expect(result).toEqual({
        name: 'Con terraza',
        properties: [{ ...property, coverPhotoUrl: null }],
      });
      expect(result).not.toHaveProperty('managementToken');
      expect(JSON.stringify(result)).not.toContain('secret-mgmt-token');
    });

    it('rechaza un identificador de solo lectura que no corresponde a ninguna lista', async () => {
      (listsRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findByShareToken('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addProperty (2.2)', () => {
    const managementToken = 'mgmt-token';

    function mockListLookup(items: unknown[] = []) {
      (listsRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'list-id',
        name: 'TOP 3',
        managementToken,
        shareToken: 'share-token',
        items,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it('añade una propiedad existente del catalogo a la lista', async () => {
      const property = { id: 'prop-1', media: [] };
      mockListLookup([]);
      (propertiesRepository.findOne as jest.Mock).mockResolvedValue(property);
      // Tras el INSERT IGNORE, la relectura de la lista ya incluye el item.
      (listsRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({
          id: 'list-id',
          name: 'TOP 3',
          managementToken,
          shareToken: 'share-token',
          items: [],
        })
        .mockResolvedValueOnce({
          id: 'list-id',
          name: 'TOP 3',
          managementToken,
          shareToken: 'share-token',
          items: [{ property }],
        });

      const result = await service.addProperty(managementToken, { propertyId: 'prop-1' });

      expect(insertQueryBuilder.orIgnore).toHaveBeenCalled();
      expect(insertQueryBuilder.values).toHaveBeenCalledWith({
        listId: 'list-id',
        propertyId: 'prop-1',
      });
      expect(result.properties).toHaveLength(1);
    });

    it('no duplica una propiedad ya presente en la lista (INSERT IGNORE) dejando la lista sin cambios', async () => {
      const property = { id: 'prop-1', media: [] };
      const existingList = {
        id: 'list-id',
        name: 'TOP 3',
        managementToken,
        shareToken: 'share-token',
        items: [{ property }],
      };
      (listsRepository.findOne as jest.Mock).mockResolvedValue(existingList);
      (propertiesRepository.findOne as jest.Mock).mockResolvedValue(property);

      const result = await service.addProperty(managementToken, { propertyId: 'prop-1' });

      expect(insertQueryBuilder.orIgnore).toHaveBeenCalled();
      expect(result.properties).toHaveLength(1);
    });

    it('rechaza añadir una propiedad que no existe en el catalogo', async () => {
      mockListLookup([]);
      (propertiesRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addProperty(managementToken, { propertyId: 'no-existe' }),
      ).rejects.toThrow(NotFoundException);
      expect(insertQueryBuilder.execute).not.toHaveBeenCalled();
    });

    it('rechaza la operación con un identificador de gestión inválido', async () => {
      (listsRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addProperty('invalido', { propertyId: 'prop-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza modificar la lista usando su identificador de solo lectura en vez del de gestión', async () => {
      // El shareToken nunca coincide con la columna management_token: misma
      // busqueda que un token invalido cualquiera.
      (listsRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addProperty('share-token', { propertyId: 'prop-1' }),
      ).rejects.toThrow(NotFoundException);
      expect(propertiesRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('removeProperty (2.2)', () => {
    const managementToken = 'mgmt-token';

    it('quita una propiedad incluida en la lista', async () => {
      (listsRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'list-id',
        managementToken,
      });

      await service.removeProperty(managementToken, 'prop-1');

      expect(itemsRepository.delete).toHaveBeenCalledWith({
        listId: 'list-id',
        propertyId: 'prop-1',
      });
    });

    it('rechaza la operación con un identificador de gestión inválido', async () => {
      (listsRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.removeProperty('invalido', 'prop-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(itemsRepository.delete).not.toHaveBeenCalled();
    });

    it('rechaza modificar la lista usando su identificador de solo lectura en vez del de gestión', async () => {
      (listsRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.removeProperty('share-token', 'prop-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(itemsRepository.delete).not.toHaveBeenCalled();
    });
  });
});
