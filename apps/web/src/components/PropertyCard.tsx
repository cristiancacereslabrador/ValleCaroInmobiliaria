import Link from 'next/link';
import { OperationType, type Property } from '../lib/api/types';
import {
  formatListingPrice,
  formatPricePerM2,
  formatPropertyLocation,
  formatSurface,
  PROPERTY_AMENITY_FIELDS,
  propertyTypeLabel,
} from '../lib/format';
import { resolveMediaUrl } from '../lib/config';
import { SaveToListButton } from './SaveToListButton';

export function PropertyCard({
  property,
  commuteDurationMinutes,
}: {
  property: Property;
  commuteDurationMinutes?: number;
}) {
  const location = formatPropertyLocation(property);
  const heading = property.title?.trim() ? property.title : propertyTypeLabel(property.type);
  const facts = [
    property.surfaceM2 ? formatSurface(property.surfaceM2) : null,
    property.bedrooms !== null ? `${property.bedrooms} hab.` : null,
    property.bathrooms !== null ? `${property.bathrooms} baños` : null,
    property.parkingSpaces !== null ? `${property.parkingSpaces} puestos` : null,
  ].filter(Boolean);
  const pricePerM2 = formatPricePerM2(property.price, property.surfaceM2);
  const highlights = PROPERTY_AMENITY_FIELDS.filter(({ key }) => property[key] === true)
    .slice(0, 2)
    .map(({ label }) => label);

  return (
    <div className="property-card-wrapper">
      <Link href={`/properties/${property.id}`} className="property-card">
        <div className="property-card-media">
          {property.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(property.coverPhotoUrl)}
              alt={`Foto de ${heading}`}
              className="property-card-photo"
            />
          ) : (
            <div className="property-card-photo-placeholder">Sin foto</div>
          )}
          <div className="property-card-overlays">
            <span className="badge badge-solid">
              {property.operationType === OperationType.RENT ? 'Alquiler' : 'Venta'}
            </span>
            <span className="badge">{propertyTypeLabel(property.type)}</span>
            {commuteDurationMinutes !== undefined && (
              <span className="badge commute-duration-badge">{commuteDurationMinutes} min</span>
            )}
          </div>
        </div>
        <div className="property-card-body">
          <p className="property-card-price">{formatListingPrice(property.price, property.operationType)}</p>
          {pricePerM2 && <p className="property-card-unit">{pricePerM2}</p>}
          <p className="property-card-title">{heading}</p>
          {location && <p className="property-card-location">{location}</p>}
          {facts.length > 0 && <p className="property-card-meta">{facts.join(' · ')}</p>}
          {highlights.length > 0 && (
            <p className="property-card-highlights">{highlights.join(' · ')}</p>
          )}
        </div>
      </Link>
      <SaveToListButton propertyId={property.id} className="property-card-save" compact />
    </div>
  );
}
