import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from '../properties/entities/property.entity';
import { PropertyValuationEstimatorController } from './property-valuation-estimator.controller';
import { PropertyValuationEstimatorService } from './property-valuation-estimator.service';

/**
 * Capability nueva (proposal.md - Capabilities:
 * `property-valuation-estimator`). Registra su propio
 * `TypeOrmModule.forFeature` (solo lectura, sobre `Property`) en vez de
 * importar `PropertiesModule`, igual que `price-trends`/`nearby-services`/
 * `saved-property-lists` - no toca `properties.service.ts` ni
 * `properties.controller.ts` (aislamiento del task brief).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Property])],
  controllers: [PropertyValuationEstimatorController],
  providers: [PropertyValuationEstimatorService],
  exports: [PropertyValuationEstimatorService],
})
export class PropertyValuationEstimatorModule {}
