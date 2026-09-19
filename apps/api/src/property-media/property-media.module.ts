import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyMedia } from './entities/property-media.entity';
import { PropertyMediaService } from './property-media.service';
import { PropertyMediaController } from './property-media.controller';
import { MediaStorageService } from './media-storage.service';
import { PropertiesModule } from '../properties/properties.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyMedia]), PropertiesModule, AuthModule],
  controllers: [PropertyMediaController],
  providers: [PropertyMediaService, MediaStorageService],
  exports: [MediaStorageService],
})
export class PropertyMediaModule {}
