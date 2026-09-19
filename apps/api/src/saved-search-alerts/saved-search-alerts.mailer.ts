import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail/mail.service';
import { SavedSearchAlert } from './entities/saved-search-alert.entity';
import { Property } from '../properties/entities/property.entity';
import { propertyTypeLabel, operationTypeLabel } from './format.util';

/**
 * Construye y envia los 3 emails de este modulo (confirmacion, nueva
 * coincidencia, cambio de precio). Mantiene el contenido de los emails
 * separado de `MailService` (transporte generico) y de
 * `SavedSearchAlertsService` (orquestacion), y separado de
 * `properties.service.ts` (no se toca ese archivo mas de lo estrictamente
 * necesario para emitir los eventos).
 */
@Injectable()
export class SavedSearchAlertsMailer {
  private readonly webBaseUrl: string;

  constructor(
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {
    this.webBaseUrl = this.config.get<string>('WEB_BASE_URL', 'http://localhost:3000').replace(/\/$/, '');
  }

  private confirmationUrl(token: string): string {
    return `${this.webBaseUrl}/alerts/confirm/${token}`;
  }

  private unsubscribeUrl(token: string): string {
    return `${this.webBaseUrl}/alerts/unsubscribe/${token}`;
  }

  private propertyUrl(propertyId: string): string {
    return `${this.webBaseUrl}/properties/${propertyId}`;
  }

  /** spec.md, Requirement "Confirmacion de la alerta por email (doble opt-in)". */
  async sendConfirmationEmail(alert: SavedSearchAlert): Promise<boolean> {
    const confirmUrl = this.confirmationUrl(alert.confirmationToken);
    const unsubscribeUrl = this.unsubscribeUrl(alert.unsubscribeToken);

    return this.mailService.sendMail({
      to: alert.email,
      subject: 'Confirma tu alerta de búsqueda',
      text: `Confirma tu alerta de búsqueda visitando este enlace: ${confirmUrl}\n\nSi no diste de alta esta alerta, ignora este email o date de baja aquí: ${unsubscribeUrl}`,
      html: `
        <p>Has solicitado recibir avisos por email para una búsqueda en nuestro catálogo de propiedades.</p>
        <p><a href="${confirmUrl}">Confirma tu alerta de búsqueda</a> para activarla.</p>
        <p style="color:#6b6660;font-size:12px;">Si no diste de alta esta alerta, ignórala o <a href="${unsubscribeUrl}">date de baja aquí</a>.</p>
      `,
    });
  }

  /** spec.md, Requirement "Notificacion de nuevas coincidencias". */
  async sendNewMatchEmail(alert: SavedSearchAlert, property: Property): Promise<boolean> {
    const propertyUrl = this.propertyUrl(property.id);
    const unsubscribeUrl = this.unsubscribeUrl(alert.unsubscribeToken);
    const summary = this.describeProperty(property);

    return this.mailService.sendMail({
      to: alert.email,
      subject: 'Nueva propiedad que coincide con tu búsqueda',
      text: `Hay una propiedad nueva que coincide con tu búsqueda guardada:\n\n${summary}\n\nVerla: ${propertyUrl}\n\nDarte de baja de esta alerta: ${unsubscribeUrl}`,
      html: `
        <p>Hay una propiedad nueva que coincide con tu búsqueda guardada:</p>
        <p>${summary}</p>
        <p><a href="${propertyUrl}">Ver la propiedad</a></p>
        <p style="color:#6b6660;font-size:12px;"><a href="${unsubscribeUrl}">Darte de baja de esta alerta</a></p>
      `,
    });
  }

  /** spec.md, Requirement "Notificacion de cambio de precio en una propiedad guardada". */
  async sendPriceChangeEmail(
    alert: SavedSearchAlert,
    property: Property,
    previousPrice: string,
    newPrice: string,
  ): Promise<boolean> {
    const propertyUrl = this.propertyUrl(property.id);
    const unsubscribeUrl = this.unsubscribeUrl(alert.unsubscribeToken);
    const summary = this.describeProperty(property);
    const direction = Number(newPrice) < Number(previousPrice) ? 'bajado' : 'subido';

    return this.mailService.sendMail({
      to: alert.email,
      subject: 'Cambio de precio en una propiedad de tu búsqueda',
      text: `El precio de una propiedad que coincide con tu búsqueda ha ${direction}, de USD ${previousPrice} a USD ${newPrice}:\n\n${summary}\n\nVerla: ${propertyUrl}\n\nDarte de baja de esta alerta: ${unsubscribeUrl}`,
      html: `
        <p>El precio de una propiedad que coincide con tu búsqueda ha ${direction}, de <strong>USD ${previousPrice}</strong> a <strong>USD ${newPrice}</strong>:</p>
        <p>${summary}</p>
        <p><a href="${propertyUrl}">Ver la propiedad</a></p>
        <p style="color:#6b6660;font-size:12px;"><a href="${unsubscribeUrl}">Darte de baja de esta alerta</a></p>
      `,
    });
  }

  private describeProperty(property: Property): string {
    const parts = [propertyTypeLabel(property.type), operationTypeLabel(property.operationType), `USD ${property.price}`];
    if (property.city) parts.push(property.city);
    return parts.join(' · ');
  }
}
