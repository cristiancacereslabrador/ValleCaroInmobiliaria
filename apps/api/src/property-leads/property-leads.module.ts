import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BrokerSettings } from '../broker-settings/entities/broker-settings.entity';
import { Property } from '../properties/entities/property.entity';
import { MailService } from '../saved-search-alerts/mail/mail.service';
import { PropertyLead } from './entities/property-lead.entity';
import { PropertyLeadsController } from './property-leads.controller';
import { PropertyLeadsService } from './property-leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyLead, Property, BrokerSettings]), AuthModule],
  controllers: [PropertyLeadsController],
  providers: [PropertyLeadsService, MailService],
})
export class PropertyLeadsModule {}
