import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from '../properties/entities/property.entity';
import { SimilarPropertiesController } from './similar-properties.controller';
import { SimilarPropertiesService } from './similar-properties.service';

/**
 * Capability nueva y aislada (proposal.md - Capabilities: `similar-properties`).
 * Registra su propio `TypeOrmModule.forFeature` (solo lectura, sobre
 * `Property`) en vez de importar `PropertiesModule`, igual que
 * `nearby-services` y `price-trends`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Property])],
  controllers: [SimilarPropertiesController],
  providers: [SimilarPropertiesService],
  exports: [SimilarPropertiesService],
})
export class SimilarPropertiesModule {}
