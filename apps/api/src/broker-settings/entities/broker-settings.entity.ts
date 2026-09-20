import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { SAN_CRISTOBAL_CENTER, SAN_CRISTOBAL_ZOOM } from '../../common/geo';

export const BROKER_SETTINGS_ID = 'default';

@Entity({ name: 'broker_settings' })
export class BrokerSettings {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'business_name', type: 'varchar', length: 120, default: 'Portal de captaciones' })
  businessName: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  slogan: string | null;

  @Column({ name: 'advisor_name', type: 'varchar', length: 120, nullable: true })
  advisorName: string | null;

  @Column({ name: 'advisor_title', type: 'varchar', length: 120, nullable: true })
  advisorTitle: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl: string | null;

  @Column({ name: 'whatsapp', type: 'varchar', length: 20, nullable: true })
  whatsapp: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  instagram: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  facebook: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  tiktok: string | null;

  @Column({ name: 'office_address', type: 'varchar', length: 255, nullable: true })
  officeAddress: string | null;

  @Column({ name: 'primary_color', type: 'varchar', length: 16, default: '#E11D8A' })
  primaryColor: string;

  @Column({ name: 'secondary_color', type: 'varchar', length: 16, default: '#6D28D9' })
  secondaryColor: string;

  @Column({
    name: 'map_center_lat',
    type: 'decimal',
    precision: 10,
    scale: 7,
    default: SAN_CRISTOBAL_CENTER.lat,
  })
  mapCenterLat: string;

  @Column({
    name: 'map_center_lng',
    type: 'decimal',
    precision: 10,
    scale: 7,
    default: SAN_CRISTOBAL_CENTER.lng,
  })
  mapCenterLng: string;

  @Column({ name: 'map_zoom', type: 'int', default: SAN_CRISTOBAL_ZOOM })
  mapZoom: number;

  @Column({ name: 'coverage_text', type: 'varchar', length: 255, nullable: true })
  coverageText: string | null;

  @Column({ name: 'business_hours', type: 'varchar', length: 180, nullable: true })
  businessHours: string | null;

  @Column({ name: 'footer_legal', type: 'varchar', length: 500, nullable: true })
  footerLegal: string | null;

  @Column({ name: 'about_text', type: 'text', nullable: true })
  aboutText: string | null;

  @Column({ type: 'text', nullable: true })
  testimonials: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
