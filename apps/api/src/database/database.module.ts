import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'node:path';
import { Property } from '../properties/entities/property.entity';
import { PropertyPriceHistory } from '../properties/entities/property-price-history.entity';
import { PropertyMedia } from '../property-media/entities/property-media.entity';
import { SavedPropertyList } from '../saved-property-lists/entities/saved-property-list.entity';
import { SavedPropertyListItem } from '../saved-property-lists/entities/saved-property-list-item.entity';
import { SavedSearchAlert } from '../saved-search-alerts/entities/saved-search-alert.entity';
import { BrokerUser } from '../auth/entities/broker-user.entity';
import { BrokerSettings } from '../broker-settings/entities/broker-settings.entity';
import { PropertyLead } from '../property-leads/entities/property-lead.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3307),
        username: config.get<string>('DB_USERNAME', 'real_estate'),
        password: config.get<string>('DB_PASSWORD', 'real_estate'),
        database: config.get<string>('DB_DATABASE', 'real_estate'),
        entities: [
          Property,
          PropertyPriceHistory,
          PropertyMedia,
          SavedPropertyList,
          SavedPropertyListItem,
          SavedSearchAlert,
          BrokerUser,
          BrokerSettings,
          PropertyLead,
        ],
        synchronize: false,
        migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
        migrationsRun:
          config.get('NODE_ENV') === 'production' ||
          config.get('DB_MIGRATIONS_RUN') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}
