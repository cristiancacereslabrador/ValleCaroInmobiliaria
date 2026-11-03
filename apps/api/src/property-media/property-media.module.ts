import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyMedia } from './entities/property-media.entity';
import { PropertyMediaService } from './property-media.service';
import { PropertyMediaController } from './property-media.controller';
import { MediaStorageService } from './media-storage.service';
import { UploadSessionsController } from './upload-sessions.controller';
import { UploadSessionsService } from './upload-sessions.service';
import { PropertiesModule } from '../properties/properties.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyMedia]), PropertiesModule, AuthModule],
  controllers: [UploadSessionsController, PropertyMediaController],
  providers: [PropertyMediaService, MediaStorageService, UploadSessionsService],
  exports: [MediaStorageService],
})
export class PropertyMediaModule {}
