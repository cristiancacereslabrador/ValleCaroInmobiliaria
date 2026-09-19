/**
 * Tipos de inmueble para el mercado venezolano.
 * Los valores de España (flat/chalet/attic/duplex) se migran a
 * apartment/quinta/penthouse/townhouse.
 */
export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  QUINTA = 'quinta',
  TOWNHOUSE = 'townhouse',
  PENTHOUSE = 'penthouse',
  STUDIO = 'studio',
  COMMERCIAL = 'commercial',
  WAREHOUSE = 'warehouse',
  OFFICE = 'office',
  LAND = 'land',
  FARM = 'farm',
}
