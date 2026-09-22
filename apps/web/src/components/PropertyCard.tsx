'use client';

import Link from 'next/link';
import { MediaType, OperationType, type Property } from '../lib/api/types';
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
import { WhatsAppCta } from './WhatsAppCta';
import { PhotoCarousel } from './PhotoCarousel';

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 3.2A8.7 8.7 0 0 0 3.4 11.9c0 1.53.4 3.02 1.16 4.34L3.2 20.8l4.7-1.32A8.7 8.7 0 0 0 12.04 20.6 8.7 8.7 0 0 0 20.8 11.9 8.7 8.7 0 0 0 12.04 3.2zm4.15 10.46c-.23-.11-1.34-.66-1.55-.73-.21-.08-.36-.11-.51.11-.15.23-.58.73-.71.88-.13.15-.26.17-.49.06-.23-.11-.96-.35-1.83-1.13-.68-.6-1.13-1.35-1.27-1.58-.13-.23-.01-.35.1-.46.1-.1.23-.26.34-.4.11-.13.15-.23.23-.38.08-.15.04-.28-.02-.4-.06-.11-.51-1.23-.7-1.68-.18-.44-.37-.38-.51-.39h-.43c-.15 0-.4.06-.6.28-.21.23-.8.78-.8 1.9 0 1.12.82 2.2.93 2.35.11.15 1.62 2.47 3.92 3.46.55.24.97.38 1.3.48.55.18 1.04.15 1.43.09.44-.07 1.34-.55 1.53-1.08.19-.53.19-.98.13-1.08-.05-.09-.21-.15-.44-.26z"
      />
    </svg>
  );
}

export function PropertyCard({
  property,
  commuteDurationMinutes,
  whatsapp,
}: {
  property: Property;
  commuteDurationMinutes?: number;
  whatsapp?: string | null;
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
  const whatsappDigits = whatsapp?.trim() || '';
  const whatsappText = `Hola, me interesa ${heading} (/properties/${property.id})`;
  const photos = (property.media ?? [])
    .filter((item) => item.type === MediaType.PHOTO)
    .slice()
    .sort((a, b) => {
      if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
      return a.position - b.position;
    })
    .map((item, index) => ({
      src: resolveMediaUrl(item.url),
      alt: `Foto ${index + 1} de ${heading}`,
    }));
  const images =
    photos.length > 0
      ? photos
      : property.coverPhotoUrl
        ? [{ src: resolveMediaUrl(property.coverPhotoUrl), alt: `Foto de ${heading}` }]
        : [];

  return (
    <div className="property-card-wrapper">
      <article className="property-card">
        <div className="property-card-media">
          {images.length > 0 ? (
            <PhotoCarousel
              variant="card"
              images={images}
              href={`/properties/${property.id}`}
              intervalMs={5500}
              delayMs={400 + (property.id.charCodeAt(0) * 17 + property.id.length * 41) % 2400}
            />
          ) : (
            <Link href={`/properties/${property.id}`} className="property-card-photo-placeholder">
              Sin foto
            </Link>
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
          {whatsappDigits && (
            <WhatsAppCta
              digits={whatsappDigits}
              message={whatsappText}
              propertyId={property.id}
              className="property-card-whatsapp"
            >
              <WhatsAppGlyph />
              <span className="visually-hidden">WhatsApp</span>
            </WhatsAppCta>
          )}
        </div>
        <div className="property-card-content">
          <Link href={`/properties/${property.id}`} className="property-card-body">
            <p className="property-card-price">{formatListingPrice(property.price, property.operationType)}</p>
            {pricePerM2 && <p className="property-card-unit">{pricePerM2}</p>}
            <p className="property-card-title">{heading}</p>
            {location && <p className="property-card-location">{location}</p>}
            {facts.length > 0 && <p className="property-card-meta">{facts.join(' · ')}</p>}
            {highlights.length > 0 && (
              <p className="property-card-highlights">{highlights.join(' · ')}</p>
            )}
          </Link>
          <SaveToListButton propertyId={property.id} className="property-card-save" compact />
        </div>
      </article>
    </div>
  );
}
