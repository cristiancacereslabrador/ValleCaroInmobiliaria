import 'reflect-metadata';
import { propertyMatchesCriteria } from './property-criteria-matcher';
import { Property } from '../properties/entities/property.entity';
import { PropertyType } from '../properties/entities/property-type.enum';
import { OperationType } from '../properties/entities/operation-type.enum';
import { QueryPropertiesDto } from '../properties/dto/query-properties.dto';

function buildProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'p1',
    type: PropertyType.APARTMENT,
    operationType: OperationType.SALE,
    price: '150000',
    surfaceM2: null,
    bedrooms: null,
    bathrooms: null,
    floor: null,
    constructionYear: null,
    status: null,
    address: null,
    latitude: null,
    longitude: null,
    hasElevator: null,
    needsRenovation: null,
    city: null,
    postalCode: null,
    media: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Property;
}

function buildCriteria(overrides: Partial<QueryPropertiesDto> = {}): QueryPropertiesDto {
  return Object.assign(new QueryPropertiesDto(), overrides);
}

describe('propertyMatchesCriteria', () => {
  it('coincide cuando no hay criterios (alerta sin filtros)', () => {
    expect(propertyMatchesCriteria(buildProperty(), buildCriteria())).toBe(true);
  });

  it('no coincide si el tipo de vivienda difiere', () => {
    const property = buildProperty({ type: PropertyType.HOUSE });
    expect(propertyMatchesCriteria(property, buildCriteria({ type: PropertyType.APARTMENT }))).toBe(false);
  });

  it('no coincide si la operacion difiere', () => {
    const property = buildProperty({ operationType: OperationType.RENT });
    expect(propertyMatchesCriteria(property, buildCriteria({ operationType: OperationType.SALE }))).toBe(false);
  });

  it('respeta el rango de precio (min y max)', () => {
    const property = buildProperty({ price: '200000' });
    expect(propertyMatchesCriteria(property, buildCriteria({ minPrice: 250000 }))).toBe(false);
    expect(propertyMatchesCriteria(property, buildCriteria({ maxPrice: 150000 }))).toBe(false);
    expect(propertyMatchesCriteria(property, buildCriteria({ minPrice: 100000, maxPrice: 250000 }))).toBe(true);
  });

  it('exige al menos las habitaciones pedidas y descarta null', () => {
    expect(propertyMatchesCriteria(buildProperty({ bedrooms: 3 }), buildCriteria({ minBedrooms: 3 }))).toBe(true);
    expect(propertyMatchesCriteria(buildProperty({ bedrooms: 2 }), buildCriteria({ minBedrooms: 3 }))).toBe(false);
    expect(propertyMatchesCriteria(buildProperty({ bedrooms: null }), buildCriteria({ minBedrooms: 1 }))).toBe(false);
  });

  it('un atributo booleano "no indicado" (null) no coincide ni con true ni con false', () => {
    const property = buildProperty({ hasElevator: null });
    expect(propertyMatchesCriteria(property, buildCriteria({ hasElevator: true }))).toBe(false);
    expect(propertyMatchesCriteria(property, buildCriteria({ hasElevator: false }))).toBe(false);
  });

  it('hasElevator/needsRenovation coinciden por igualdad exacta', () => {
    const property = buildProperty({ hasElevator: true, needsRenovation: false });
    expect(propertyMatchesCriteria(property, buildCriteria({ hasElevator: true }))).toBe(true);
    expect(propertyMatchesCriteria(property, buildCriteria({ hasElevator: false }))).toBe(false);
    expect(propertyMatchesCriteria(property, buildCriteria({ needsRenovation: false }))).toBe(true);
  });

  it('groundFloor: floor=0 coincide con true, floor!=0 con false, floor=null con ninguno', () => {
    expect(propertyMatchesCriteria(buildProperty({ floor: 0 }), buildCriteria({ groundFloor: true }))).toBe(true);
    expect(propertyMatchesCriteria(buildProperty({ floor: 3 }), buildCriteria({ groundFloor: true }))).toBe(false);
    expect(propertyMatchesCriteria(buildProperty({ floor: 3 }), buildCriteria({ groundFloor: false }))).toBe(true);
    expect(propertyMatchesCriteria(buildProperty({ floor: null }), buildCriteria({ groundFloor: false }))).toBe(false);
    expect(propertyMatchesCriteria(buildProperty({ floor: null }), buildCriteria({ groundFloor: true }))).toBe(false);
  });

  it('area: excluye propiedades sin coordenadas, incluye las que caen dentro del poligono', () => {
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 10, lng: 10 },
      { lat: 10, lng: 0 },
    ];

    const withoutCoordinates = buildProperty({ latitude: null, longitude: null });
    expect(propertyMatchesCriteria(withoutCoordinates, buildCriteria({ area: square }))).toBe(false);

    const inside = buildProperty({ latitude: '5', longitude: '5' });
    expect(propertyMatchesCriteria(inside, buildCriteria({ area: square }))).toBe(true);

    const outside = buildProperty({ latitude: '50', longitude: '50' });
    expect(propertyMatchesCriteria(outside, buildCriteria({ area: square }))).toBe(false);
  });

  it('combina varios criterios a la vez (todos deben cumplirse)', () => {
    const property = buildProperty({
      type: PropertyType.APARTMENT,
      operationType: OperationType.SALE,
      price: '180000',
      hasElevator: true,
    });

    expect(
      propertyMatchesCriteria(
        property,
        buildCriteria({ type: PropertyType.APARTMENT, maxPrice: 200000, hasElevator: true }),
      ),
    ).toBe(true);

    expect(
      propertyMatchesCriteria(
        property,
        buildCriteria({ type: PropertyType.APARTMENT, maxPrice: 200000, hasElevator: false }),
      ),
    ).toBe(false);
  });
});
