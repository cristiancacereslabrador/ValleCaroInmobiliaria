import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { ListingStatus } from '../properties/entities/listing-status.enum';
import { PropertyLead } from './entities/property-lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class PropertyLeadsService {
  constructor(
    @InjectRepository(PropertyLead)
    private readonly leads: Repository<PropertyLead>,
    @InjectRepository(Property)
    private readonly properties: Repository<Property>,
  ) {}

  async create(propertyId: string, dto: CreateLeadDto): Promise<{ id: string }> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Indica un email o un teléfono para poder contactarte');
    }

    const property = await this.properties.findOne({ where: { id: propertyId } });
    if (!property || property.listingStatus !== ListingStatus.PUBLISHED) {
      throw new NotFoundException('La propiedad no está disponible');
    }

    const saved = await this.leads.save(
      this.leads.create({
        propertyId,
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        message: dto.message.trim(),
      }),
    );
    return { id: saved.id };
  }

  list() {
    return this.leads.find({
      relations: ['property'],
      order: { createdAt: 'DESC' },
    });
  }
}
