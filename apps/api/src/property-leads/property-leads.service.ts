import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingStatus } from '../properties/entities/listing-status.enum';
import { Property } from '../properties/entities/property.entity';
import { BrokerSettings } from '../broker-settings/entities/broker-settings.entity';
import { OperationType } from '../properties/entities/operation-type.enum';
import { MailService } from '../saved-search-alerts/mail/mail.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { PropertyLead } from './entities/property-lead.entity';
import { LeadIntent, LeadOrigin, LeadStatus } from './lead.enums';

@Injectable()
export class PropertyLeadsService {
  constructor(
    @InjectRepository(PropertyLead)
    private readonly leads: Repository<PropertyLead>,
    @InjectRepository(Property)
    private readonly properties: Repository<Property>,
    @InjectRepository(BrokerSettings)
    private readonly settings: Repository<BrokerSettings>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateLeadDto, routePropertyId?: string): Promise<PropertyLead> {
    const origin = dto.origin ?? LeadOrigin.WEB;
    const propertyId = routePropertyId ?? dto.propertyId ?? null;
    const property = propertyId ? await this.requirePublishedProperty(propertyId) : null;

    if (!property && origin !== LeadOrigin.VALUATION && origin !== LeadOrigin.SELL_FORM) {
      if (origin !== LeadOrigin.WHATSAPP || !dto.message) {
        throw new BadRequestException('Indica una propiedad, o usa el formulario de captación o tasación.');
      }
    }

    if (origin !== LeadOrigin.WHATSAPP && !dto.email && !dto.phone) {
      throw new BadRequestException('Deja un correo o un teléfono para contactarte.');
    }

    const saved = await this.leads.save(
      this.leads.create({
        propertyId: property?.id ?? null,
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        message: dto.message.trim(),
        origin,
        status: LeadStatus.NEW,
        intent: dto.intent ?? this.inferIntent(origin, property),
        visitAt: dto.visitAt ? new Date(dto.visitAt) : null,
      }),
    );

    void this.notifyAdvisor(saved, property);
    return saved;
  }

  findAll(): Promise<PropertyLead[]> {
    return this.leads.find({
      relations: { property: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: LeadStatus): Promise<PropertyLead> {
    const lead = await this.leads.findOne({ where: { id }, relations: { property: true } });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} no encontrado`);
    }
    lead.status = status;
    return this.leads.save(lead);
  }

  private inferIntent(origin: LeadOrigin, property: Property | null): LeadIntent | null {
    if (origin === LeadOrigin.VALUATION || origin === LeadOrigin.SELL_FORM) {
      return LeadIntent.SELL;
    }
    if (property?.operationType === OperationType.RENT) {
      return LeadIntent.RENT;
    }
    if (property?.operationType === OperationType.SALE) {
      return LeadIntent.BUY;
    }
    return null;
  }

  private async requirePublishedProperty(id: string): Promise<Property> {
    const property = await this.properties.findOne({
      where: { id, listingStatus: ListingStatus.PUBLISHED },
    });
    if (!property) {
      throw new NotFoundException(`Propiedad ${id} no encontrada`);
    }
    return property;
  }

  private async notifyAdvisor(lead: PropertyLead, property: Property | null): Promise<void> {
    const broker = await this.settings.findOne({ where: { id: 'default' } });
    const to = this.notifyTo() || broker?.email?.trim() || '';
    if (!to) {
      return;
    }
    const cc = this.notifyCc(to);
    const originLabel: Record<LeadOrigin, string> = {
      [LeadOrigin.WEB]: 'Formulario web',
      [LeadOrigin.WHATSAPP]: 'WhatsApp',
      [LeadOrigin.VALUATION]: 'Tasación',
      [LeadOrigin.SELL_FORM]: 'Quiero vender / alquilar',
    };
    const lines = [
      `Nuevo lead (${originLabel[lead.origin] ?? lead.origin})`,
      `Nombre: ${lead.name}`,
      lead.email ? `Email: ${lead.email}` : null,
      lead.phone ? `Teléfono: ${lead.phone}` : null,
      property ? `Propiedad: ${property.title} (${property.id})` : 'Sin ficha asociada',
      lead.visitAt ? `Visita pedida: ${lead.visitAt.toISOString()}` : null,
      '',
      lead.message,
    ].filter((line): line is string => line !== null);

    const text = lines.join('\n');
    await this.mail.sendMail({
      to,
      cc,
      subject: property
        ? `Lead: ${property.title}`
        : `Lead: ${originLabel[lead.origin] ?? 'captación'}`,
      text,
      html: `<pre>${text.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char] ?? char))}</pre>`,
    });
  }

  private notifyTo(): string {
    return this.config.get<string>('SMTP_NOTIFY_TO', '').trim();
  }

  private notifyCc(to: string): string | undefined {
    const cc = this.config.get<string>('SMTP_NOTIFY_CC', '').trim();
    if (!cc || cc.toLowerCase() === to.toLowerCase()) {
      return undefined;
    }
    return cc;
  }
}
