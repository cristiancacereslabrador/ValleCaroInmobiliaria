import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SavedPropertyList } from './saved-property-list.entity';
import { Property } from '../../properties/entities/property.entity';

/**
 * Relacion lista <-> propiedad guardada (design.md - Decision 2): tabla de
 * relacion simple con constraint unico (`list_id`, `property_id`) para que
 * "anadir una propiedad ya presente" (spec.md, Scenario "Anadir una
 * propiedad ya presente en la lista") no duplique la entrada sin logica
 * adicional en la aplicacion (INSERT IGNORE en
 * SavedPropertyListsService.addProperty).
 *
 * `property` es una relacion de solo lectura hacia la entidad `Property` ya
 * existente (no se edita properties.entity.ts ni properties.service.ts).
 * `ON DELETE CASCADE` en ambos lados: si se borra la lista o la propiedad
 * referenciada, el item deja de tener sentido.
 */
@Entity({ name: 'saved_property_list_items' })
@Unique('UQ_saved_property_list_item_list_property', ['listId', 'propertyId'])
export class SavedPropertyListItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'list_id', type: 'varchar', length: 36 })
  listId: string;

  @ManyToOne(() => SavedPropertyList, (list) => list.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list: SavedPropertyList;

  @Column({ name: 'property_id', type: 'varchar', length: 36 })
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
