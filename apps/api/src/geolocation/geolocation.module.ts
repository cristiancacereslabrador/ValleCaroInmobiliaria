import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [HttpModule.register({ timeout: 5000 })],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeolocationModule {}
