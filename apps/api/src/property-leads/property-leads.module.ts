import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Property } from '../properties/entities/property.entity';
import { PropertyLead } from './entities/property-lead.entity';
import { PropertyLeadsController } from './property-leads.controller';
import { PropertyLeadsService } from './property-leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyLead, Property]), AuthModule],
  controllers: [PropertyLeadsController],
  providers: [PropertyLeadsService],
})
export class PropertyLeadsModule {}
