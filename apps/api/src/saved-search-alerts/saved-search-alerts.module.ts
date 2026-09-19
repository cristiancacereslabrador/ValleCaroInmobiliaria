import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedSearchAlert } from './entities/saved-search-alert.entity';
import { SavedSearchAlertsController } from './saved-search-alerts.controller';
import { SavedSearchAlertsService } from './saved-search-alerts.service';
import { SavedSearchAlertsMailer } from './saved-search-alerts.mailer';
import { MailService } from './mail/mail.service';

/**
 * Modulo autocontenido de `saved-search-alerts` (proposal.md - Capabilities):
 * registra su propia entidad y no importa `PropertiesModule` ni ningun otro
 * modulo del catalogo - `property-criteria-matcher.ts` opera sobre
 * instancias de `Property` que le llegan ya cargadas via los eventos
 * `property.created`/`property.priceChanged` (emitidos por
 * `PropertiesService`, consumidos aqui mediante `@OnEvent`), sin necesitar
 * su propio repositorio de `Property`.
 *
 * `EventEmitterModule.forRoot()` se registra una unica vez en `AppModule`
 * (modulo `@Global`); no hace falta importarlo aqui para que `@OnEvent`
 * funcione.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SavedSearchAlert])],
  controllers: [SavedSearchAlertsController],
  providers: [SavedSearchAlertsService, SavedSearchAlertsMailer, MailService],
})
export class SavedSearchAlertsModule {}
