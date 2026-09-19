import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BrokerSettings } from './entities/broker-settings.entity';
import { BrokerSettingsController } from './broker-settings.controller';
import { BrokerSettingsService } from './broker-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([BrokerSettings]), AuthModule],
  controllers: [BrokerSettingsController],
  providers: [BrokerSettingsService],
  exports: [BrokerSettingsService],
})
export class BrokerSettingsModule {}
