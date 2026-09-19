import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BrokerSettingsService } from './broker-settings.service';
import { UpdateBrokerSettingsDto } from './dto/update-broker-settings.dto';

function brokerUploadDir() {
  const dir = path.join(process.cwd(), 'storage', 'broker');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

@Controller()
export class BrokerSettingsController {
  constructor(private readonly settingsService: BrokerSettingsService) {}

  @Get('broker-settings')
  getPublic() {
    return this.settingsService.getPublic();
  }

  @Patch('admin/broker-settings')
  @UseGuards(JwtAuthGuard)
  update(@Body() dto: UpdateBrokerSettingsDto) {
    return this.settingsService.update(dto);
  }

  @Post('admin/broker-settings/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, brokerUploadDir()),
        filename: (_req, file, cb) => cb(null, `logo${path.extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    return this.settingsService.setAssetUrl('logo', `/media/broker/${file.filename}`);
  }

  @Post('admin/broker-settings/photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, brokerUploadDir()),
        filename: (_req, file, cb) => cb(null, `photo${path.extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    return this.settingsService.setAssetUrl('photo', `/media/broker/${file.filename}`);
  }
}
