import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PropertyType } from './property-type.enum';
import { OperationType } from './operation-type.enum';
import { ListingStatus } from './listing-status.enum';
import { PropertyMedia } from '../../property-media/entities/property-media.entity';

@Entity({ name: 'properties' })
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PropertyType })
  type: PropertyType;

  @Column({ name: 'operation_type', type: 'enum', enum: OperationType })
  operationType: OperationType;

  @Column({
    name: 'listing_status',
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.DRAFT,
  })
  listingStatus: ListingStatus;

  @Column({ type: 'varchar', length: 150, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  @Column({
    name: 'surface_m2',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  surfaceM2: string | null;

  @Column({
    name: 'land_surface_m2',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  landSurfaceM2: string | null;

  @Column({ type: 'int', nullable: true })
  bedrooms: number | null;

  @Column({ type: 'int', nullable: true })
  bathrooms: number | null;

  @Column({ name: 'parking_spaces', type: 'int', nullable: true })
  parkingSpaces: number | null;

  @Column({ type: 'int', nullable: true })
  floor: number | null;

  @Column({ name: 'construction_year', type: 'int', nullable: true })
  constructionYear: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  status: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  municipality: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  parish: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  urbanization: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: string | null;

  @Column({ name: 'has_elevator', type: 'boolean', nullable: true })
  hasElevator: boolean | null;

  @Column({ name: 'needs_renovation', type: 'boolean', nullable: true })
  needsRenovation: boolean | null;

  @Column({ name: 'has_power_plant', type: 'boolean', nullable: true })
  hasPowerPlant: boolean | null;

  @Column({ name: 'has_cistern', type: 'boolean', nullable: true })
  hasCistern: boolean | null;

  @Column({ name: 'has_water_well', type: 'boolean', nullable: true })
  hasWaterWell: boolean | null;

  @Column({ name: 'has_direct_gas', type: 'boolean', nullable: true })
  hasDirectGas: boolean | null;

  @Column({ name: 'has_security', type: 'boolean', nullable: true })
  hasSecurity: boolean | null;

  @Column({ name: 'is_gated_community', type: 'boolean', nullable: true })
  isGatedCommunity: boolean | null;

  @Column({ name: 'is_furnished', type: 'boolean', nullable: true })
  isFurnished: boolean | null;

  @Column({ name: 'is_semi_furnished', type: 'boolean', nullable: true })
  isSemiFurnished: boolean | null;

  @Column({ name: 'has_air_conditioning', type: 'boolean', nullable: true })
  hasAirConditioning: boolean | null;

  @Column({ name: 'has_pool', type: 'boolean', nullable: true })
  hasPool: boolean | null;

  @Column({ name: 'has_garden', type: 'boolean', nullable: true })
  hasGarden: boolean | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @OneToMany(() => PropertyMedia, (media) => media.property)
  media: PropertyMedia[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
