import { ListingStatus, OperationType, PropertyType } from './api/types';

const TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: 'Apartamento',
  [PropertyType.HOUSE]: 'Casa',
  [PropertyType.QUINTA]: 'Quinta',
  [PropertyType.TOWNHOUSE]: 'Townhouse',
  [PropertyType.PENTHOUSE]: 'Penthouse',
  [PropertyType.STUDIO]: 'Estudio',
  [PropertyType.COMMERCIAL]: 'Local comercial',
  [PropertyType.WAREHOUSE]: 'Galpón / Bodega',
  [PropertyType.OFFICE]: 'Oficina',
  [PropertyType.LAND]: 'Terreno',
  [PropertyType.FARM]: 'Finca',
};

const OPERATION_LABELS: Record<OperationType, string> = {
  [OperationType.SALE]: 'Venta',
  [OperationType.RENT]: 'Alquiler',
};

const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  [ListingStatus.DRAFT]: 'Borrador',
  [ListingStatus.PUBLISHED]: 'Publicada',
  [ListingStatus.PAUSED]: 'Pausada',
};

export function propertyTypeLabel(type: PropertyType): string {
  return TYPE_LABELS[type] ?? type;
}

export function operationTypeLabel(operationType: OperationType): string {
  return OPERATION_LABELS[operationType] ?? operationType;
}

export function listingStatusLabel(status: ListingStatus): string {
  return LISTING_STATUS_LABELS[status] ?? status;
}

export function formatPrice(price: string | number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  const numeric = typeof price === 'string' ? Number(price) : price;
  if (Number.isNaN(numeric)) return '—';
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatListingPrice(
  price: string | number | null | undefined,
  operationType?: OperationType,
): string {
  const formatted = formatPrice(price);
  if (formatted === '—' || operationType !== OperationType.RENT) {
    return formatted;
  }
  return `${formatted} / mes`;
}

export function formatSurface(surfaceM2: string | number | null | undefined): string {
  if (surfaceM2 === null || surfaceM2 === undefined) return '—';
  const numeric = typeof surfaceM2 === 'string' ? Number(surfaceM2) : surfaceM2;
  if (Number.isNaN(numeric)) return '—';
  return `${new Intl.NumberFormat('es-VE', { maximumFractionDigits: 0 }).format(numeric)} m²`;
}

export function formatPricePerM2(
  price: string | number | null | undefined,
  surfaceM2: string | number | null | undefined,
): string | null {
  if (price === null || price === undefined || surfaceM2 === null || surfaceM2 === undefined) {
    return null;
  }
  const amount = typeof price === 'string' ? Number(price) : price;
  const surface = typeof surfaceM2 === 'string' ? Number(surfaceM2) : surfaceM2;
  if (Number.isNaN(amount) || Number.isNaN(surface) || surface <= 0) {
    return null;
  }
  return `${formatPrice(amount / surface)} / m²`;
}

export function formatPropertyLocation(property: {
  urbanization?: string | null;
  parish?: string | null;
  municipality?: string | null;
  city?: string | null;
  state?: string | null;
}): string {
  const parts = [
    property.urbanization || property.parish,
    property.municipality || property.city,
    property.state,
  ].filter((part): part is string => Boolean(part && part.trim()));
  return [...new Set(parts)].join(' · ');
}

export function formatNullableNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : String(value);
}

export function formatNullableText(value: string | null | undefined): string {
  return value && value.length > 0 ? value : '—';
}

export function formatNullableBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return 'No indicado';
  return value ? 'Sí' : 'No';
}

export function buildWhatsAppLink(whatsappDigits: string, text: string): string {
  const digits = whatsappDigits.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const PROPERTY_AMENITY_FIELDS = [
  { key: 'hasPowerPlant', label: 'Planta eléctrica' },
  { key: 'hasCistern', label: 'Cisterna' },
  { key: 'hasWaterWell', label: 'Pozo de agua' },
  { key: 'hasDirectGas', label: 'Gas directo' },
  { key: 'hasSecurity', label: 'Vigilancia' },
  { key: 'isGatedCommunity', label: 'Conjunto cerrado' },
  { key: 'isFurnished', label: 'Amoblado' },
  { key: 'hasAirConditioning', label: 'Aire acondicionado' },
  { key: 'hasPool', label: 'Piscina' },
  { key: 'hasGarden', label: 'Jardín' },
] as const;
