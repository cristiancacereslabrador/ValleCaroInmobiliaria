import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Property } from './property.entity';

/**
 * Historico de precio de una propiedad (neighborhood-market-insights change -
 * design.md Decision 2: "Historico de precio: tabla dedicada
 * property_price_history"). Tabla append-only: cada fila representa el
 * precio que quedo obsoleto al editar la propiedad, junto con la fecha de
 * ese cambio (`recordedAt`). Poblada exclusivamente por
 * `PropertiesService.update` (ver properties.service.ts).
 *
 * price-trends spec, Scenario "Precio inicial de una propiedad nueva": el
 * precio con el que se crea la propiedad NO genera una fila aqui (queda solo
 * como referencia en `properties.price`) hasta la primera edicion que lo
 * cambie.
 */
@Entity({ name: 'property_price_history' })
export class PropertyPriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id', type: 'varchar', length: 36 })
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  @Column({ name: 'recorded_at', type: 'datetime' })
  recordedAt: Date;
}
