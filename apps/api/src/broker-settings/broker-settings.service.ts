import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SAN_CRISTOBAL_CENTER, SAN_CRISTOBAL_ZOOM } from '../common/geo';
import { BrokerSettings, BROKER_SETTINGS_ID } from './entities/broker-settings.entity';
import { UpdateBrokerSettingsDto } from './dto/update-broker-settings.dto';

@Injectable()
export class BrokerSettingsService {
  constructor(
    @InjectRepository(BrokerSettings)
    private readonly repo: Repository<BrokerSettings>,
    private readonly configService: ConfigService,
  ) {}

  async getPublic(): Promise<BrokerSettings> {
    const existing = await this.repo.findOne({ where: { id: BROKER_SETTINGS_ID } });
    if (existing) {
      return existing;
    }
    return this.repo.save(
      this.repo.create({
        id: BROKER_SETTINGS_ID,
        businessName: this.configService.get<string>('BROKER_DEFAULT_NAME', 'Portal de captaciones'),
        mapCenterLat: String(SAN_CRISTOBAL_CENTER.lat),
        mapCenterLng: String(SAN_CRISTOBAL_CENTER.lng),
        mapZoom: SAN_CRISTOBAL_ZOOM,
        coverageText: 'San Cristóbal, Táchira, Venezuela',
      }),
    );
  }

  async update(dto: UpdateBrokerSettingsDto): Promise<BrokerSettings> {
    const current = await this.getPublic();
    Object.assign(current, {
      ...dto,
      mapCenterLat:
        dto.mapCenterLat !== undefined ? dto.mapCenterLat.toString() : current.mapCenterLat,
      mapCenterLng:
        dto.mapCenterLng !== undefined ? dto.mapCenterLng.toString() : current.mapCenterLng,
      whatsapp: dto.whatsapp !== undefined ? this.normalizeWhatsapp(dto.whatsapp) : current.whatsapp,
    });
    return this.repo.save(current);
  }

  async setAssetUrl(kind: 'logo' | 'photo', url: string): Promise<BrokerSettings> {
    const current = await this.getPublic();
    if (kind === 'logo') {
      current.logoUrl = url;
    } else {
      current.photoUrl = url;
    }
    return this.repo.save(current);
  }

  private normalizeWhatsapp(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    return digits;
  }
}
