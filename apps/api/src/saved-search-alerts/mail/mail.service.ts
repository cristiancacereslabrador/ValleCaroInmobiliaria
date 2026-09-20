import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  cc?: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * tasks.md 1.2. Envoltorio fino sobre Nodemailer/SMTP (design.md -
 * Decision 2): SMTP configurable por variables de entorno, sin depender de
 * un proveedor transaccional de terceros. El resto del modulo (ver
 * `saved-search-alerts.mailer.ts`) nunca usa Nodemailer directamente, solo
 * este servicio - si se decide cambiar de proveedor en el futuro, el cambio
 * queda contenido aqui.
 *
 * design.md - Risks/Trade-offs: "un servidor SMTP mal configurado podria
 * bloquear silenciosamente todas las notificaciones" -> `sendMail` nunca
 * lanza, se limita a loguear el fallo y devolver `false`, para que un
 * problema de SMTP no tumbe ningun flujo que dependa de el (crear una
 * alerta, crear/editar una propiedad).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('SMTP_USER', '');
    const password = this.config.get<string>('SMTP_PASSWORD', '').replace(/\s+/g, '');
    const host = this.config.get<string>('SMTP_HOST', 'localhost');
    const port = Number(this.config.get('SMTP_PORT', 1025));
    const secure = this.config.get<string>('SMTP_SECURE', 'false') === 'true';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure && port === 587,
      auth: user ? { user, pass: password } : undefined,
    });

    this.from = this.config.get<string>('SMTP_FROM', 'alertas@real-estate-platform.test');

    if (!password) {
      this.logger.warn(
        `SMTP_PASSWORD vacío (${host}:${port}). Los avisos se guardan como lead, pero el email no saldrá.`,
      );
    }
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({ from: this.from, ...options });
      return true;
    } catch (error) {
      this.logger.error(
        `Fallo al enviar email a "${options.to}" ("${options.subject}"): ${(error as Error).message}`,
      );
      return false;
    }
  }
}
