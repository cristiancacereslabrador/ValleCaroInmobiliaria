import { PropertyType } from '../properties/entities/property-type.enum';
import { OperationType } from '../properties/entities/operation-type.enum';

export function propertyTypeLabel(type: PropertyType): string {
  const labels: Record<PropertyType, string> = {
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
  return labels[type] ?? type;
}

export function operationTypeLabel(operationType: OperationType): string {
  const labels: Record<OperationType, string> = {
    [OperationType.SALE]: 'Venta',
    [OperationType.RENT]: 'Alquiler',
  };
  return labels[operationType] ?? operationType;
}
