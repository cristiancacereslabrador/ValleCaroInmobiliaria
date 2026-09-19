import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Property } from '../properties/entities/property.entity';
import { PropertyPriceHistory } from '../properties/entities/property-price-history.entity';
import { PropertyMedia } from '../property-media/entities/property-media.entity';
import { SavedPropertyList } from '../saved-property-lists/entities/saved-property-list.entity';
import { SavedPropertyListItem } from '../saved-property-lists/entities/saved-property-list-item.entity';
import { SavedSearchAlert } from '../saved-search-alerts/entities/saved-search-alert.entity';
import { BrokerUser } from '../auth/entities/broker-user.entity';
import { BrokerSettings } from '../broker-settings/entities/broker-settings.entity';
import { PropertyLead } from '../property-leads/entities/property-lead.entity';

dotenv.config();

/**
 * DataSource usado exclusivamente por la CLI de TypeORM
 * (`npm run migration:generate` / `migration:run` / `migration:revert`,
 * ver package.json). La app en tiempo de ejecucion usa
 * `TypeOrmModule.forRootAsync` en `src/database/database.module.ts`.
 */
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3307),
  username: process.env.DB_USERNAME ?? 'real_estate',
  password: process.env.DB_PASSWORD ?? 'real_estate',
  database: process.env.DB_DATABASE ?? 'real_estate',
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
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});

export default AppDataSource;
