import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SavedSearchAlertStatus } from './saved-search-alert-status.enum';

/**
 * Alerta de busqueda guardada (proposal.md - saved-search-alerts,
 * design.md - Decision 1): guarda los criterios de busqueda del catalogo
 * (mismo shape que `QueryPropertiesDto`, ver
 * `../property-criteria-matcher.ts`) junto con un email de contacto, sin
 * cuenta de usuario, siguiendo el mismo patron de "quien conserva el token
 * controla el recurso" que `saved-property-lists` (ver el comentario de
 * `SavedPropertyList`).
 *
 * Dos tokens UUID v4 independientes, generados en la aplicacion (no son
 * `PrimaryGeneratedColumn`):
 * - `confirmationToken`: consumido una unica vez para pasar de `pending` a
 *   `active` (doble opt-in). Deja de ser util tras la confirmacion o tras
 *   expirar, pero no se borra (permite responder de forma informativa a un
 *   reintento).
 * - `unsubscribeToken`: incluido en todos los emails relacionados con la
 *   alerta (confirmacion y notificaciones); da de baja la alerta en
 *   cualquier momento de su ciclo de vida.
 */
@Entity({ name: 'saved_search_alerts' })
export class SavedSearchAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  /**
   * Criterios de busqueda serializados como JSON (design.md - Decision 1):
   * mismo shape que `QueryPropertiesDto`, evita migrar esta tabla cada vez
   * que el catalogo anade un filtro nuevo.
   */
  @Column({ type: 'json' })
  criteria: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: SavedSearchAlertStatus,
    default: SavedSearchAlertStatus.PENDING,
  })
  status: SavedSearchAlertStatus;

  @Column({ name: 'confirmation_token', type: 'varchar', length: 36, unique: true })
  confirmationToken: string;

  @Column({ name: 'confirmation_expires_at', type: 'datetime' })
  confirmationExpiresAt: Date;

  @Column({ name: 'unsubscribe_token', type: 'varchar', length: 36, unique: true })
  unsubscribeToken: string;

  /**
   * IP de origen de la solicitud de creacion (design.md - Decision 4:
   * rate limiting de creacion de alertas por IP). No se expone en ninguna
   * respuesta de la API.
   */
  @Column({ name: 'request_ip', type: 'varchar', length: 45, nullable: true })
  requestIp: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
