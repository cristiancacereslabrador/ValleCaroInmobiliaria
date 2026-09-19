import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from '../properties/entities/property.entity';
import { NearbyServicesController } from './nearby-services.controller';
import { NearbyServicesService } from './nearby-services.service';

/**
 * Capability nueva (proposal.md - Capabilities: `nearby-services`).
 * Registra su propio `TypeOrmModule.forFeature([Property])` (solo lectura,
 * para resolver coordenadas) en vez de importar `PropertiesModule`, siguiendo
 * el mismo patron desacoplado que `saved-property-lists`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Property]), HttpModule.register({ timeout: 5000 })],
  controllers: [NearbyServicesController],
  providers: [NearbyServicesService],
  exports: [NearbyServicesService],
})
export class NearbyServicesModule {}
