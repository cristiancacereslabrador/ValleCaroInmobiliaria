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

export enum OperationType {
  SALE = 'sale',
  RENT = 'rent',
}

export enum ListingStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  PAUSED = 'paused',
}

export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
  TOUR_360 = 'tour360',
}

export interface PropertyMedia {
  id: string;
  propertyId: string;
  type: MediaType;
  url: string;
  isCover: boolean;
  position: number;
  createdAt: string;
}

export interface Property {
  id: string;
  type: PropertyType;
  operationType: OperationType;
  listingStatus: ListingStatus;
  title: string | null;
  description: string | null;
  price: string;
  surfaceM2: string | null;
  landSurfaceM2: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  floor: number | null;
  constructionYear: number | null;
  status: string | null;
  address: string | null;
  state: string | null;
  municipality: string | null;
  parish: string | null;
  urbanization: string | null;
  latitude: string | null;
  longitude: string | null;
  hasElevator: boolean | null;
  needsRenovation: boolean | null;
  hasPowerPlant: boolean | null;
  hasCistern: boolean | null;
  hasWaterWell: boolean | null;
  hasDirectGas: boolean | null;
  hasSecurity: boolean | null;
  isGatedCommunity: boolean | null;
  isFurnished: boolean | null;
  isSemiFurnished: boolean | null;
  hasAirConditioning: boolean | null;
  hasPool: boolean | null;
  hasGarden: boolean | null;
  city: string | null;
  postalCode: string | null;
  media: PropertyMedia[];
  coverPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyInput {
  type: PropertyType;
  operationType: OperationType;
  listingStatus?: ListingStatus;
  title?: string;
  description?: string;
  price: number;
  surfaceM2?: number;
  landSurfaceM2?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  floor?: number;
  constructionYear?: number;
  status?: string;
  address?: string;
  state?: string;
  municipality?: string;
  parish?: string;
  urbanization?: string;
  latitude?: number;
  longitude?: number;
  hasElevator?: boolean;
  needsRenovation?: boolean;
  hasPowerPlant?: boolean;
  hasCistern?: boolean;
  hasWaterWell?: boolean;
  hasDirectGas?: boolean;
  hasSecurity?: boolean;
  isGatedCommunity?: boolean;
  isFurnished?: boolean;
  isSemiFurnished?: boolean;
  hasAirConditioning?: boolean;
  hasPool?: boolean;
  hasGarden?: boolean;
  city?: string;
  postalCode?: string;
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

export interface AreaVertex {
  lat: number;
  lng: number;
}

export interface PropertyFilters {
  type?: PropertyType;
  operationType?: OperationType;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  state?: string;
  municipality?: string;
  urbanization?: string;
  hasElevator?: boolean;
  groundFloor?: boolean;
  needsRenovation?: boolean;
  listingStatus?: ListingStatus;
  area?: AreaVertex[];
}

export interface BrokerSettings {
  id: string;
  businessName: string;
  slogan: string | null;
  advisorName: string | null;
  advisorTitle: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  officeAddress: string | null;
  primaryColor: string;
  secondaryColor: string;
  mapCenterLat: string;
  mapCenterLng: string;
  mapZoom: number;
  coverageText: string | null;
  businessHours: string | null;
  footerLegal: string | null;
  aboutText: string | null;
  testimonials?: string | null;
}

export interface BrokerUser {
  id: string;
  email: string;
  name: string;
}

export type LeadOrigin = 'web' | 'whatsapp' | 'valuation' | 'sell_form';
export type LeadStatus = 'nuevo' | 'contactado' | 'visita' | 'cerrado';
export type LeadIntent = 'buy' | 'rent' | 'sell' | 'visit';

export interface PropertyLead {
  id: string;
  propertyId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  origin: LeadOrigin;
  status: LeadStatus;
  intent: LeadIntent | null;
  visitAt: string | null;
  createdAt: string;
  property?: Property | null;
}
