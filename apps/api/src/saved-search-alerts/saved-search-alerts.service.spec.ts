import { GoneException, HttpException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedSearchAlertsService } from './saved-search-alerts.service';
import { SavedSearchAlertsMailer } from './saved-search-alerts.mailer';
import { SavedSearchAlert } from './entities/saved-search-alert.entity';
import { SavedSearchAlertStatus } from './entities/saved-search-alert-status.enum';
import { PropertyType } from '../properties/entities/property-type.enum';
import { OperationType } from '../properties/entities/operation-type.enum';
import { Property } from '../properties/entities/property.entity';

function buildProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'prop-1',
    type: PropertyType.APARTMENT,
    operationType: OperationType.SALE,
    price: '150000',
    surfaceM2: null,
    bedrooms: null,
    bathrooms: null,
    floor: null,
    constructionYear: null,
    status: null,
    address: null,
    latitude: null,
    longitude: null,
    hasElevator: null,
    needsRenovation: null,
    city: null,
    postalCode: null,
    media: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Property;
}

function buildAlert(overrides: Partial<SavedSearchAlert> = {}): SavedSearchAlert {
  return {
    id: 'alert-1',
    email: 'persona@example.com',
    criteria: {},
    status: SavedSearchAlertStatus.PENDING,
    confirmationToken: 'confirm-token',
    confirmationExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    unsubscribeToken: 'unsubscribe-token',
    requestIp: '127.0.0.1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as SavedSearchAlert;
}

describe('SavedSearchAlertsService', () => {
  let service: SavedSearchAlertsService;
  let repository: jest.Mocked<Repository<SavedSearchAlert>>;
  let mailer: { sendConfirmationEmail: jest.Mock; sendNewMatchEmail: jest.Mock; sendPriceChangeEmail: jest.Mock };
  let configValues: Record<string, unknown>;
  let ipCountQueryBuilder: { where: jest.Mock; andWhere: jest.Mock; getCount: jest.Mock };

  beforeEach(async () => {
    configValues = {};

    mailer = {
      sendConfirmationEmail: jest.fn().mockResolvedValue(true),
      sendNewMatchEmail: jest.fn().mockResolvedValue(true),
      sendPriceChangeEmail: jest.fn().mockResolvedValue(true),
    };

    // El conteo por IP se resuelve con `createQueryBuilder` (comparacion de
    // fecha del lado de MariaDB, `NOW() - INTERVAL ...`, ver
    // saved-search-alerts.service.ts) en vez de `repository.count`.
    ipCountQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedSearchAlertsService,
        {
          provide: getRepositoryToken(SavedSearchAlert),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: data.id ?? 'generated-id', ...data })),
            findOne: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
            createQueryBuilder: jest.fn(() => ipCountQueryBuilder),
          },
        },
        { provide: SavedSearchAlertsMailer, useValue: mailer },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string, fallback?: unknown) => configValues[key] ?? fallback) },
        },
      ],
    }).compile();

    service = module.get(SavedSearchAlertsService);
    repository = module.get(getRepositoryToken(SavedSearchAlert));
  });

  describe('create', () => {
    it('crea la alerta en estado pendiente y envia el email de confirmacion', async () => {
      const result = await service.create(
        { email: 'persona@example.com', criteria: { minPrice: 100000 } } as any,
        '203.0.113.5',
      );

      expect(result.status).toBe(SavedSearchAlertStatus.PENDING);
      expect(repository.save).toHaveBeenCalled();
      expect(mailer.sendConfirmationEmail).toHaveBeenCalledTimes(1);
    });

    it('rechaza la creacion si se supera el limite de alertas por IP en la ventana configurada', async () => {
      configValues.ALERT_RATE_LIMIT_IP_MAX = 5;
      ipCountQueryBuilder.getCount.mockResolvedValueOnce(5); // conteo por IP ya en el limite

      await expect(
        service.create({ email: 'persona@example.com', criteria: {} } as any, '203.0.113.5'),
      ).rejects.toThrow(HttpException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rechaza la creacion si se supera el maximo de alertas activas/pendientes por email', async () => {
      configValues.ALERT_RATE_LIMIT_EMAIL_MAX_ACTIVE = 10;
      ipCountQueryBuilder.getCount.mockResolvedValueOnce(0); // conteo por IP, dentro del limite
      repository.count.mockResolvedValueOnce(10); // conteo por email, ya en el limite

      await expect(
        service.create({ email: 'persona@example.com', criteria: {} } as any, '203.0.113.5'),
      ).rejects.toThrow(HttpException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('acepta la creacion cuando los contadores estan por debajo del limite configurado', async () => {
      configValues.ALERT_RATE_LIMIT_IP_MAX = 5;
      configValues.ALERT_RATE_LIMIT_EMAIL_MAX_ACTIVE = 10;
      ipCountQueryBuilder.getCount.mockResolvedValueOnce(4);
      repository.count.mockResolvedValueOnce(9);

      await expect(
        service.create({ email: 'persona@example.com', criteria: {} } as any, '203.0.113.5'),
      ).resolves.toMatchObject({ status: SavedSearchAlertStatus.PENDING });
    });
  });

  describe('confirm', () => {
    it('activa una alerta pendiente con un token valido y no vencido', async () => {
      const alert = buildAlert({ status: SavedSearchAlertStatus.PENDING });
      repository.findOne.mockResolvedValue(alert);

      const result = await service.confirm('confirm-token');

      expect(result.status).toBe(SavedSearchAlertStatus.ACTIVE);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: SavedSearchAlertStatus.ACTIVE }),
      );
    });

    it('rechaza un token de confirmacion inexistente', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.confirm('token-inexistente')).rejects.toThrow(NotFoundException);
    });

    it('rechaza un token valido pero expirado, y no lo activa', async () => {
      const alert = buildAlert({
        status: SavedSearchAlertStatus.PENDING,
        confirmationExpiresAt: new Date(Date.now() - 1000),
      });
      repository.findOne.mockResolvedValue(alert);

      await expect(service.confirm('confirm-token')).rejects.toThrow(GoneException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('confirmar una alerta ya activa es idempotente (no lanza)', async () => {
      const alert = buildAlert({ status: SavedSearchAlertStatus.ACTIVE });
      repository.findOne.mockResolvedValue(alert);

      const result = await service.confirm('confirm-token');
      expect(result.status).toBe(SavedSearchAlertStatus.ACTIVE);
    });
  });

  describe('unsubscribe', () => {
    it('desactiva una alerta activa mediante su token de baja', async () => {
      const alert = buildAlert({ status: SavedSearchAlertStatus.ACTIVE });
      repository.findOne.mockResolvedValue(alert);

      const result = await service.unsubscribe('unsubscribe-token');

      expect(result.alreadyUnsubscribed).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: SavedSearchAlertStatus.UNSUBSCRIBED }),
      );
    });

    it('informa sin error si la alerta ya estaba dada de baja', async () => {
      const alert = buildAlert({ status: SavedSearchAlertStatus.UNSUBSCRIBED });
      repository.findOne.mockResolvedValue(alert);

      const result = await service.unsubscribe('unsubscribe-token');

      expect(result.alreadyUnsubscribed).toBe(true);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rechaza un token de baja inexistente', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.unsubscribe('token-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('handlePropertyCreated', () => {
    it('notifica a cada alerta activa que coincide con la propiedad nueva', async () => {
      const matching = buildAlert({ id: 'a1', criteria: { type: PropertyType.APARTMENT } });
      const nonMatching = buildAlert({ id: 'a2', criteria: { type: PropertyType.HOUSE } });
      repository.find.mockResolvedValue([matching, nonMatching]);

      const property = buildProperty({ type: PropertyType.APARTMENT });
      await service.handlePropertyCreated({ property });

      expect(mailer.sendNewMatchEmail).toHaveBeenCalledTimes(1);
      expect(mailer.sendNewMatchEmail).toHaveBeenCalledWith(matching, property);
    });

    it('no envia nada si ninguna alerta activa coincide', async () => {
      repository.find.mockResolvedValue([buildAlert({ criteria: { type: PropertyType.HOUSE } })]);

      await service.handlePropertyCreated({ property: buildProperty({ type: PropertyType.APARTMENT }) });

      expect(mailer.sendNewMatchEmail).not.toHaveBeenCalled();
    });

    it('notifica una vez por cada alerta que coincide, incluso con el mismo email', async () => {
      const alertA = buildAlert({ id: 'a1', email: 'mismo@example.com' });
      const alertB = buildAlert({ id: 'a2', email: 'mismo@example.com' });
      repository.find.mockResolvedValue([alertA, alertB]);

      await service.handlePropertyCreated({ property: buildProperty() });

      expect(mailer.sendNewMatchEmail).toHaveBeenCalledTimes(2);
    });

    it('un fallo de envio de email no se propaga (no bloquea ni revierte la creacion)', async () => {
      repository.find.mockResolvedValue([buildAlert()]);
      mailer.sendNewMatchEmail.mockRejectedValueOnce(new Error('SMTP caido'));

      await expect(service.handlePropertyCreated({ property: buildProperty() })).resolves.toBeUndefined();
    });

    it('un fallo al consultar las alertas tampoco se propaga', async () => {
      repository.find.mockRejectedValueOnce(new Error('DB caida'));
      await expect(service.handlePropertyCreated({ property: buildProperty() })).resolves.toBeUndefined();
    });
  });

  describe('handlePropertyPriceChanged', () => {
    it('notifica el cambio de precio a las alertas activas que coinciden', async () => {
      repository.find.mockResolvedValue([buildAlert()]);

      const property = buildProperty({ price: '180000' });
      await service.handlePropertyPriceChanged({ property, previousPrice: '150000', newPrice: '180000' });

      expect(mailer.sendPriceChangeEmail).toHaveBeenCalledWith(expect.anything(), property, '150000', '180000');
    });

    it('no notifica si la propiedad no coincide con ninguna alerta activa', async () => {
      repository.find.mockResolvedValue([buildAlert({ criteria: { type: PropertyType.HOUSE } })]);

      await service.handlePropertyPriceChanged({
        property: buildProperty({ type: PropertyType.APARTMENT }),
        previousPrice: '150000',
        newPrice: '180000',
      });

      expect(mailer.sendPriceChangeEmail).not.toHaveBeenCalled();
    });
  });
});
