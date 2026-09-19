import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { PropertyLeadsService } from './property-leads.service';

@Controller()
export class PropertyLeadsController {
  constructor(private readonly leadsService: PropertyLeadsService) {}

  @Post('properties/:propertyId/leads')
  @HttpCode(HttpStatus.CREATED)
  create(@Param('propertyId', ParseUUIDPipe) propertyId: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(propertyId, dto);
  }

  @Get('admin/leads')
  @UseGuards(JwtAuthGuard)
  list() {
    return this.leadsService.list();
  }
}
