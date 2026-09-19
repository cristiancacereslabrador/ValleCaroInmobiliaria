import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { PropertyPriceHistory } from './entities/property-price-history.entity';
import { PropertiesService } from './properties.service';
import { AdminPropertiesController, PropertiesController } from './properties.controller';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Property, PropertyPriceHistory]), GeolocationModule, AuthModule],
  controllers: [PropertiesController, AdminPropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
