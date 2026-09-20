import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PropertyLeadsService } from './property-leads.service';

@Controller()
export class PropertyLeadsController {
  constructor(private readonly service: PropertyLeadsService) {}

  @Post('properties/:id/leads')
  createForProperty(
    @Param('id', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.service.create(dto, propertyId);
  }

  @Post('leads')
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/leads')
  list() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/leads/:id')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
