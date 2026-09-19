import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SavedPropertyListItem } from './saved-property-list-item.entity';

/**
 * Lista de propiedades guardadas (proposal.md - saved-property-lists,
 * design.md - Decision 1): identificada por un nombre y dos tokens UUID v4
 * independientes generados en la creacion (SavedPropertyListsService.create):
 * - `managementToken`: permite anadir/quitar propiedades y consultar la lista
 *   en modo gestion (incluye ambos tokens en la respuesta).
 * - `shareToken`: permite consultar la lista en modo solo lectura (compartir
 *   el enlace) sin exponer `managementToken` y sin permitir modificarla.
 *
 * Sin nocion de "usuario propietario" (design.md - Non-Goals): quien
 * conserva `managementToken` controla la lista, igual que el patron de
 * `saved-search-alerts`.
 */
@Entity({ name: 'saved_property_lists' })
export class SavedPropertyList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'management_token', type: 'varchar', length: 36, unique: true })
  managementToken: string;

  @Column({ name: 'share_token', type: 'varchar', length: 36, unique: true })
  shareToken: string;

  @OneToMany(() => SavedPropertyListItem, (item) => item.list)
  items: SavedPropertyListItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
