import { Property } from '../properties/entities/property.entity';

/**
 * Shape de los eventos internos que `PropertiesService` emite (design.md -
 * Decision 3) y que este modulo consume. Se definen aqui (no en
 * `properties/`) para no anadir mas superficie de la estrictamente
 * necesaria a ese modulo, que otros changes tocan en paralelo - el emisor
 * (`properties.service.ts`) construye el objeto literal directamente, sin
 * necesitar importar este tipo.
 */
export interface PropertyCreatedEvent {
  property: Property;
}

export interface PropertyPriceChangedEvent {
  property: Property;
  previousPrice: string;
  newPrice: string;
}

/** Nombres de evento (design.md - Decision 3), como constantes para evitar typos en ambos lados (emisor/listener). */
export const PROPERTY_CREATED_EVENT = 'property.created';
export const PROPERTY_PRICE_CHANGED_EVENT = 'property.priceChanged';
