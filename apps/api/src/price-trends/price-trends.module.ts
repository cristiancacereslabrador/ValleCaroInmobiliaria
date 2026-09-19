import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from '../properties/entities/property.entity';
import { PropertyPriceHistory } from '../properties/entities/property-price-history.entity';
import { PriceTrendsController } from './price-trends.controller';
import { PriceTrendsService } from './price-trends.service';

/**
 * Capability nueva (proposal.md - Capabilities: `price-trends`). Registra su
 * propio `TypeOrmModule.forFeature` (solo lectura, sobre `Property` y
 * `PropertyPriceHistory`) en vez de importar `PropertiesModule`, igual que
 * `nearby-services` y `saved-property-lists`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Property, PropertyPriceHistory])],
  controllers: [PriceTrendsController],
  providers: [PriceTrendsService],
  exports: [PriceTrendsService],
})
export class PriceTrendsModule {}
