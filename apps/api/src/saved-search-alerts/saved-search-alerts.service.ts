import { randomUUID } from 'crypto';
import { GoneException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { SavedSearchAlert } from './entities/saved-search-alert.entity';
import { SavedSearchAlertStatus } from './entities/saved-search-alert-status.enum';
import { CreateSavedSearchAlertDto } from './dto/create-saved-search-alert.dto';
import { SavedSearchAlertsMailer } from './saved-search-alerts.mailer';
import { propertyMatchesCriteria } from './property-criteria-matcher';
import { Property } from '../properties/entities/property.entity';
import { QueryPropertiesDto } from '../properties/dto/query-properties.dto';
import {
  PROPERTY_CREATED_EVENT,
  PROPERTY_PRICE_CHANGED_EVENT,
  type PropertyCreatedEvent,
  type PropertyPriceChangedEvent,
} from './property-events';

export interface CreateAlertResult {
  id: string;
  email: string;
  status: SavedSearchAlertStatus;
}

export interface ConfirmAlertResult {
  status: SavedSearchAlertStatus;
  message: string;
}

export interface UnsubscribeAlertResult {
  alreadyUnsubscribed: boolean;
  message: string;
}

@Injectable()
export class SavedSearchAlertsService {
  private readonly logger = new Logger(SavedSearchAlertsService.name);

  constructor(
    @InjectRepository(SavedSearchAlert)
    private readonly alertsRepository: Repository<SavedSearchAlert>,
    private readonly mailer: SavedSearchAlertsMailer,
    private readonly config: ConfigService,
  ) {}

  /**
   * spec.md, Requirement "Guardar una busqueda con alerta por email".
   * design.md - Decision 4: rate limiting por IP (ventana de tiempo) y por
   * email (tope de alertas activas/pendientes simultaneas) antes de crear
   * nada. El envio del email de confirmacion no bloquea la respuesta con un
   * error si falla (Risks/Trade-offs: un SMTP mal configurado no debe tumbar
   * la creacion de la alerta), solo queda logueado por `MailService`.
   */
  async create(dto: CreateSavedSearchAlertDto, requestIp: string | null): Promise<CreateAlertResult> {
    await this.enforceRateLimits(dto.email, requestIp);

    const ttlHours = this.config.get<number>('ALERT_CONFIRMATION_TTL_HOURS', 48);
    const confirmationExpiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const alert = this.alertsRepository.create({
      email: dto.email,
      criteria: dto.criteria as unknown as Record<string, unknown>,
      status: SavedSearchAlertStatus.PENDING,
      confirmationToken: randomUUID(),
      confirmationExpiresAt,
      unsubscribeToken: randomUUID(),
      requestIp,
    });

    const saved = await this.alertsRepository.save(alert);
    await this.mailer.sendConfirmationEmail(saved);

    return { id: saved.id, email: saved.email, status: saved.status };
  }

  /**
   * spec.md, Requirement "Confirmacion de la alerta por email (doble
   * opt-in)". Un token inexistente es "invalido" (404); un token existente
   * pero vencido es "expirado" (410, distinto del anterior a proposito para
   * que el frontend pueda distinguir los dos mensajes de tasks.md 2.2).
   * Confirmar dos veces la misma alerta ya activa es idempotente (no hay
   * escenario de spec que lo prohiba).
   */
  async confirm(token: string): Promise<ConfirmAlertResult> {
    const alert = await this.alertsRepository.findOne({ where: { confirmationToken: token } });

    if (!alert) {
      throw new NotFoundException('El enlace de confirmación no es válido.');
    }

    if (alert.status === SavedSearchAlertStatus.ACTIVE) {
      return { status: alert.status, message: 'Esta alerta ya estaba confirmada.' };
    }

    if (alert.status === SavedSearchAlertStatus.UNSUBSCRIBED) {
      throw new GoneException('Esta alerta ya fue dada de baja.');
    }

    // status === PENDING
    if (alert.confirmationExpiresAt.getTime() < Date.now()) {
      throw new GoneException('El enlace de confirmación ha expirado.');
    }

    alert.status = SavedSearchAlertStatus.ACTIVE;
    await this.alertsRepository.save(alert);

    return { status: alert.status, message: 'Alerta confirmada correctamente.' };
  }

  /**
   * spec.md, Requirement "Baja de una alerta sin necesidad de cuenta".
   * Scenario "Enlace de baja ya usado": no lanza error, informa con
   * `alreadyUnsubscribed: true`.
   */
  async unsubscribe(token: string): Promise<UnsubscribeAlertResult> {
    const alert = await this.alertsRepository.findOne({ where: { unsubscribeToken: token } });

    if (!alert) {
      throw new NotFoundException('El enlace de baja no es válido.');
    }

    if (alert.status === SavedSearchAlertStatus.UNSUBSCRIBED) {
      return { alreadyUnsubscribed: true, message: 'Esta alerta ya estaba dada de baja.' };
    }

    alert.status = SavedSearchAlertStatus.UNSUBSCRIBED;
    await this.alertsRepository.save(alert);

    return { alreadyUnsubscribed: false, message: 'Te has dado de baja correctamente.' };
  }

  /**
   * spec.md, Requirement "Notificacion de nuevas coincidencias".
   * design.md - Decision 3: evaluacion dirigida por el evento interno
   * `property.created` (emitido por `PropertiesService.create`), no por un
   * job periodico. Un fallo al evaluar/enviar nunca se propaga (el emisor no
   * espera esta promesa, ver `properties.service.ts`), pero se protege
   * igualmente con try/catch para que quede logueado en vez de perderse como
   * una unhandled rejection.
   */
  @OnEvent(PROPERTY_CREATED_EVENT)
  async handlePropertyCreated(event: PropertyCreatedEvent): Promise<void> {
    try {
      const matches = await this.findActiveMatches(event.property);
      await Promise.all(
        matches.map((alert) =>
          this.mailer
            .sendNewMatchEmail(alert, event.property)
            .catch((error) =>
              this.logger.error(`Fallo notificando nueva coincidencia a la alerta ${alert.id}: ${error}`),
            ),
        ),
      );
    } catch (error) {
      this.logger.error(`Fallo evaluando alertas para property.created (${event.property.id}): ${error}`);
    }
  }

  /**
   * spec.md, Requirement "Notificacion de cambio de precio en una propiedad
   * guardada". design.md - Decision 3: `property.priceChanged` se emite solo
   * cuando el precio realmente cambia (ver properties.service.ts), por lo
   * que este listener no necesita comprobarlo de nuevo.
   */
  @OnEvent(PROPERTY_PRICE_CHANGED_EVENT)
  async handlePropertyPriceChanged(event: PropertyPriceChangedEvent): Promise<void> {
    try {
      const matches = await this.findActiveMatches(event.property);
      await Promise.all(
        matches.map((alert) =>
          this.mailer
            .sendPriceChangeEmail(alert, event.property, event.previousPrice, event.newPrice)
            .catch((error) =>
              this.logger.error(`Fallo notificando cambio de precio a la alerta ${alert.id}: ${error}`),
            ),
        ),
      );
    } catch (error) {
      this.logger.error(`Fallo evaluando alertas para property.priceChanged (${event.property.id}): ${error}`);
    }
  }

  private async findActiveMatches(property: Property): Promise<SavedSearchAlert[]> {
    const activeAlerts = await this.alertsRepository.find({
      where: { status: SavedSearchAlertStatus.ACTIVE },
    });

    return activeAlerts.filter((alert) =>
      propertyMatchesCriteria(property, alert.criteria as unknown as QueryPropertiesDto),
    );
  }

  /**
   * design.md - Decision 4. Dos mecanismos independientes:
   * - por IP: maximo N creaciones en una ventana de tiempo (spam desde un
   *   mismo origen).
   * - por email: maximo M alertas "vivas" (pendientes o activas) de forma
   *   simultanea para un mismo email (no es una ventana de tiempo, es un
   *   tope de alertas vigentes a la vez).
   */
  private async enforceRateLimits(email: string, requestIp: string | null): Promise<void> {
    if (requestIp) {
      const windowHours = this.config.get<number>('ALERT_RATE_LIMIT_IP_WINDOW_HOURS', 1);
      const maxPerWindow = this.config.get<number>('ALERT_RATE_LIMIT_IP_MAX', 5);

      // La ventana de tiempo se calcula enteramente en el reloj de MariaDB
      // (`NOW() - INTERVAL ... HOUR`), sin pasar una `Date` de Node como
      // parametro: en este entorno el driver mysql2 aplica una conversion de
      // zona horaria distinta al leer (`SELECT`) y al serializar un
      // parametro `Date` entrante, lo que desincroniza una comparacion
      // "created_at >= <Date de Node>" del reloj real con el que MariaDB
      // puebla `created_at` (`DEFAULT CURRENT_TIMESTAMP`) - deja la
      // comparacion completamente del lado de MariaDB evita ese salto.
      const countByIp = await this.alertsRepository
        .createQueryBuilder('alert')
        .where('alert.requestIp = :requestIp', { requestIp })
        .andWhere('alert.createdAt >= (NOW() - INTERVAL :windowHours HOUR)', { windowHours })
        .getCount();

      if (countByIp >= maxPerWindow) {
        throw new HttpException(
          'Se ha superado el límite de alertas creadas desde esta dirección. Inténtalo más tarde.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const maxActivePerEmail = this.config.get<number>('ALERT_RATE_LIMIT_EMAIL_MAX_ACTIVE', 10);
    const countByEmail = await this.alertsRepository.count({
      where: { email, status: In([SavedSearchAlertStatus.PENDING, SavedSearchAlertStatus.ACTIVE]) },
    });

    if (countByEmail >= maxActivePerEmail) {
      throw new HttpException(
        'Se ha superado el número máximo de alertas activas para este email.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
