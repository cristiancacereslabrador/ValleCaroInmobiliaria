import { Test, TestingModule } from '@nestjs/testing';
import { SavedSearchAlertsController } from './saved-search-alerts.controller';
import { SavedSearchAlertsService } from './saved-search-alerts.service';

describe('SavedSearchAlertsController', () => {
  let controller: SavedSearchAlertsController;
  let service: { create: jest.Mock; confirm: jest.Mock; unsubscribe: jest.Mock };

  beforeEach(async () => {
    service = { create: jest.fn(), confirm: jest.fn(), unsubscribe: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedSearchAlertsController],
      providers: [{ provide: SavedSearchAlertsService, useValue: service }],
    }).compile();

    controller = module.get(SavedSearchAlertsController);
  });

  it('create delega en el servicio pasando la IP del request', async () => {
    const dto = { email: 'persona@example.com', criteria: {} } as any;
    await controller.create(dto, '203.0.113.5');
    expect(service.create).toHaveBeenCalledWith(dto, '203.0.113.5');
  });

  it('confirm delega en el servicio con el token de la ruta', async () => {
    await controller.confirm('un-token');
    expect(service.confirm).toHaveBeenCalledWith('un-token');
  });

  it('unsubscribe delega en el servicio con el token de la ruta', async () => {
    await controller.unsubscribe('otro-token');
    expect(service.unsubscribe).toHaveBeenCalledWith('otro-token');
  });
});
