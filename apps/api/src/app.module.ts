import * as path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { PropertiesModule } from './properties/properties.module';
import { PropertyMediaModule } from './property-media/property-media.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { SavedPropertyListsModule } from './saved-property-lists/saved-property-lists.module';
import { NearbyServicesModule } from './nearby-services/nearby-services.module';
import { PriceTrendsModule } from './price-trends/price-trends.module';
import { CommuteSearchModule } from './commute-search/commute-search.module';
import { PropertyValuationEstimatorModule } from './property-valuation-estimator/property-valuation-estimator.module';
import { SimilarPropertiesModule } from './similar-properties/similar-properties.module';
import { SavedSearchAlertsModule } from './saved-search-alerts/saved-search-alerts.module';
import { AuthModule } from './auth/auth.module';
import { BrokerSettingsModule } from './broker-settings/broker-settings.module';
import { PropertyLeadsModule } from './property-leads/property-leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const configuredPath = config.get<string>(
          'MEDIA_STORAGE_PATH',
          'storage/properties',
        );
        const propertiesRoot = path.isAbsolute(configuredPath)
          ? configuredPath
          : path.join(process.cwd(), configuredPath);
        const brokerRoot = path.join(process.cwd(), 'storage', 'broker');

        return [
          { rootPath: propertiesRoot, serveRoot: '/media/properties' },
          { rootPath: brokerRoot, serveRoot: '/media/broker' },
        ];
      },
    }),
    DatabaseModule,
    AuthModule,
    BrokerSettingsModule,
    PropertiesModule,
    PropertyMediaModule,
    PropertyLeadsModule,
    GeolocationModule,
    SavedPropertyListsModule,
    NearbyServicesModule,
    PriceTrendsModule,
    PropertyValuationEstimatorModule,
    SimilarPropertiesModule,
    CommuteSearchModule,
    SavedSearchAlertsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
