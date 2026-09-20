import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { LeadIntent, LeadOrigin, LeadStatus } from '../lead.enums';

@Entity({ name: 'property_leads' })
export class PropertyLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id', type: 'varchar', length: 36, nullable: true })
  propertyId: string | null;

  @ManyToOne(() => Property, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'property_id' })
  property: Property | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 1000 })
  message: string;

  @Column({ type: 'varchar', length: 32, default: LeadOrigin.WEB })
  origin: LeadOrigin;

  @Column({ type: 'varchar', length: 32, default: LeadStatus.NEW })
  status: LeadStatus;

  @Column({ type: 'varchar', length: 32, nullable: true })
  intent: LeadIntent | null;

  @Column({ name: 'visit_at', type: 'datetime', nullable: true })
  visitAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
