import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { MediaType } from './media-type.enum';

/**
 * Fotos, videos y tours virtuales 360 de una propiedad (design.md -
 * Decision 3, tabla `property_media`): `property_id` (FK), `type`
 * (photo/video/tour360), `url`, `is_cover` (bool), `position` (orden),
 * `created_at`. Ver property-virtual-tours/design.md - Decision 1: un
 * tour360 reutiliza la misma tabla y almacenamiento que una foto.
 */
@Entity({ name: 'property_media' })
export class PropertyMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id', type: 'varchar', length: 36 })
  propertyId: string;

  @ManyToOne(() => Property, (property) => property.media, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  /**
   * Ruta publica resultante devuelta por MediaStorageService
   * (design.md - Decision 4).
   */
  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ name: 'is_cover', type: 'boolean', default: false })
  isCover: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
