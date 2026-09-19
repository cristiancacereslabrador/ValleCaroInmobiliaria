import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from '../properties/entities/property.entity';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { CommuteSearchController } from './commute-search.controller';
import { CommuteSearchService } from './commute-search.service';
import { DistanceMatrixService } from './distance-matrix.service';

/**
 * Capability nueva y aislada (proposal.md - Capabilities: `commute-search`).
 * Registra su propio `TypeOrmModule.forFeature([Property])` (solo lectura)
 * en vez de importar `PropertiesModule`, mismo patron desacoplado que
 * `nearby-services`/`saved-property-lists`. Reutiliza `GeolocationModule`
 * (GeocodingService, ya exportado) para resolver un destino dado como
 * direccion, sin duplicar esa integracion.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Property]),
    HttpModule.register({ timeout: 5000 }),
    GeolocationModule,
  ],
  controllers: [CommuteSearchController],
  providers: [CommuteSearchService, DistanceMatrixService],
})
export class CommuteSearchModule {}
