'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteProperty, getProperty } from '../../../lib/api/properties';
import { getMe } from '../../../lib/api/auth';
import { getBrokerSettings } from '../../../lib/api/brokerSettings';
import { ListingStatus, MediaType, type BrokerSettings, type Property, type PropertyMedia } from '../../../lib/api/types';
import { ApiError } from '../../../lib/api/client';
import {
  formatListingPrice,
  formatNullableNumber,
  formatNullableText,
  formatPricePerM2,
  formatPropertyLocation,
  formatSurface,
  listingStatusLabel,
  operationTypeLabel,
  PROPERTY_AMENITY_FIELDS,
  propertyTypeLabel,
} from '../../../lib/format';
import { resolveMediaUrl } from '../../../lib/config';
import { PropertyMap } from '../../../components/PropertyMap';
import { MediaUploader } from '../../../components/MediaUploader';
import { MediaGallery } from '../../../components/MediaGallery';
import { PropertyTours } from '../../../components/PropertyTours';
import { SaveToListButton } from '../../../components/SaveToListButton';
import { NearbyServicesSection } from '../../../components/NearbyServicesSection';
import { PriceTrendSection } from '../../../components/PriceTrendSection';
import { SimilarPropertiesSection } from '../../../components/SimilarPropertiesSection';
import { LeadForm } from '../../../components/LeadForm';
import { WhatsAppCta } from '../../../components/WhatsAppCta';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [media, setMedia] = useState<PropertyMedia[]>([]);
  const [settings, setSettings] = useState<BrokerSettings | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageUrl, setPageUrl] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getProperty(params.id),
      getBrokerSettings().catch(() => null),
      getMe()
        .then(() => true)
        .catch(() => false),
    ])
      .then(([data, broker, staff]) => {
        if (cancelled) return;
        setProperty(data);
        setMedia(data.media ?? []);
        setSettings(broker);
        setIsStaff(staff);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? 'La propiedad solicitada no existe.'
              : 'No se pudo cargar la propiedad.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, [params.id]);

  const galleryPhotoCount = media.filter((item) => item.type === MediaType.PHOTO).length;

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setLightboxIndex(null);
        return;
      }
      if (galleryPhotoCount < 2) return;
      if (event.key === 'ArrowLeft') {
        setLightboxIndex((index) =>
          index === null ? 0 : (index + galleryPhotoCount - 1) % galleryPhotoCount,
        );
      }
      if (event.key === 'ArrowRight') {
        setLightboxIndex((index) => (index === null ? 0 : (index + 1) % galleryPhotoCount));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, galleryPhotoCount]);

  async function handleDelete() {
    if (!property) return;
    if (!window.confirm('¿Seguro que quieres eliminar esta propiedad? Esta acción no se puede deshacer.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteProperty(property.id);
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar la propiedad.');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page">
        <p className="spinner-text">Cargando propiedad…</p>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="page">
        <div className="alert alert-error">{error ?? 'La propiedad solicitada no existe.'}</div>
        <Link href="/" className="btn btn-secondary">
          Volver al catálogo
        </Link>
      </main>
    );
  }

  const heading = property.title?.trim() || propertyTypeLabel(property.type);
  const location = formatPropertyLocation(property);
  const whatsapp = settings?.whatsapp?.trim() || '';
  const publicPhotos = media.filter(
    (item) => item.type === MediaType.PHOTO || item.type === MediaType.VIDEO,
  );
  const galleryPhotos = publicPhotos.filter((item) => item.type === MediaType.PHOTO);
  const isPublished = property.listingStatus === ListingStatus.PUBLISHED;
  const whatsappText = `Hola, me interesa ${heading}${pageUrl ? ` (${pageUrl})` : ''}`;
  const pricePerM2 = formatPricePerM2(property.price, property.surfaceM2);
  const listingPrice = formatListingPrice(property.price, property.operationType);

  async function handleShare() {
    const url = pageUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: heading, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    }
  }
  const activeAmenities = PROPERTY_AMENITY_FIELDS.filter(({ key }) => property[key] === true);
  const coreSpecs = [
    { label: 'Construidos', value: property.surfaceM2 ? formatSurface(property.surfaceM2) : null },
    { label: 'Terreno', value: property.landSurfaceM2 ? formatSurface(property.landSurfaceM2) : null },
    { label: 'Habitaciones', value: property.bedrooms !== null ? formatNullableNumber(property.bedrooms) : null },
    { label: 'Baños', value: property.bathrooms !== null ? formatNullableNumber(property.bathrooms) : null },
    { label: 'Puestos', value: property.parkingSpaces !== null ? formatNullableNumber(property.parkingSpaces) : null },
    { label: 'Nivel', value: property.floor !== null ? formatNullableNumber(property.floor) : null },
    { label: 'Año', value: property.constructionYear !== null ? formatNullableNumber(property.constructionYear) : null },
    { label: 'Estado', value: property.status ? formatNullableText(property.status) : null },
  ].filter((item) => item.value);

  return (
    <main className="page page-detail">
      {galleryPhotos.length > 0 && (
        <div className={`detail-gallery count-${Math.min(galleryPhotos.length, 3)}`}>
          {galleryPhotos.slice(0, 3).map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="detail-gallery-item"
              onClick={() => setLightboxIndex(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(item.url)} alt={`${heading}, foto ${index + 1}`} />
              {index === Math.min(galleryPhotos.length, 3) - 1 && galleryPhotos.length > 3 && (
                <span className="detail-gallery-more">+{galleryPhotos.length - 3} fotos</span>
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && galleryPhotos[lightboxIndex] && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Foto de la propiedad">
          <button type="button" className="lightbox-close" onClick={() => setLightboxIndex(null)} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {galleryPhotos.length > 1 && (
            <button
              type="button"
              className="lightbox-nav is-prev"
              aria-label="Foto anterior"
              onClick={() =>
                setLightboxIndex((index) =>
                  index === null ? 0 : (index + galleryPhotos.length - 1) % galleryPhotos.length,
                )
              }
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path
                  d="M15.2 5.2 8.4 12l6.8 6.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveMediaUrl(galleryPhotos[lightboxIndex].url)}
            alt={`${heading}, foto ${lightboxIndex + 1} de ${galleryPhotos.length}`}
          />
          {galleryPhotos.length > 1 && (
            <button
              type="button"
              className="lightbox-nav is-next"
              aria-label="Foto siguiente"
              onClick={() =>
                setLightboxIndex((index) => (index === null ? 0 : (index + 1) % galleryPhotos.length))
              }
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path
                  d="M8.8 5.2 15.6 12l-6.8 6.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <p className="lightbox-count">
            {lightboxIndex + 1} / {galleryPhotos.length}
          </p>
        </div>
      )}

      <div className="detail-layout">
        <div className="detail-main">
          <p className="breadcrumb">
            <Link href="/">Catálogo</Link>
            <span> / </span>
            <span>{propertyTypeLabel(property.type)}</span>
          </p>
          <p className="eyebrow">
            {propertyTypeLabel(property.type)} · {operationTypeLabel(property.operationType)}
            {isStaff ? ` · ${listingStatusLabel(property.listingStatus)}` : ''}
          </p>
          <h1>{heading}</h1>
          {location && <p className="detail-location">{location}</p>}
          {property.address && <p className="detail-address">{property.address}</p>}

          {coreSpecs.length > 0 && (
            <dl className="spec-highlights">
              {coreSpecs.map((item) => (
                <div key={item.label} className="spec-highlight">
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {property.description && (
            <div className="section section-flush">
              <h2>La propiedad</h2>
              <p className="property-description">{property.description}</p>
            </div>
          )}

          {activeAmenities.length > 0 && (
            <div className="section section-flush">
              <h2>Amenidades</h2>
              <ul className="amenity-chips">
                {activeAmenities.map(({ key, label }) => (
                  <li key={key}>{label}</li>
                ))}
                {property.hasElevator === true && <li>Ascensor</li>}
              </ul>
            </div>
          )}

          <PropertyMap latitude={property.latitude} longitude={property.longitude} />

          {isStaff ? (
            <div className="section">
              <h2>Fotos y vídeos</h2>
              <MediaUploader propertyId={property.id} onUploaded={(item) => setMedia((prev) => [...prev, item])} />
              <MediaGallery propertyId={property.id} media={media} onChange={setMedia} />
            </div>
          ) : (
            publicPhotos.length > 3 && (
              <div className="section">
                <h2>Más fotos</h2>
                <div className="media-gallery">
                  {publicPhotos.slice(3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="media-item media-item-button"
                      onClick={() => {
                        const photoIndex = galleryPhotos.findIndex((photo) => photo.id === item.id);
                        if (photoIndex >= 0) setLightboxIndex(photoIndex);
                      }}
                    >
                      {item.type === MediaType.PHOTO ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveMediaUrl(item.url)} alt={`${heading}`} />
                      ) : (
                        <video src={resolveMediaUrl(item.url)} controls muted />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          <PropertyTours propertyId={property.id} media={media} onChange={setMedia} canManage={isStaff} />
          <NearbyServicesSection propertyId={property.id} />
          <PriceTrendSection propertyId={property.id} />
          <SimilarPropertiesSection propertyId={property.id} />
        </div>

        <aside className="detail-inquiry">
          <p className="property-card-price">{listingPrice}</p>
          {pricePerM2 && <p className="inquiry-note">{pricePerM2}</p>}
          <p className="inquiry-note">
            {operationTypeLabel(property.operationType)} · {propertyTypeLabel(property.type)}
          </p>
          <div className="detail-actions">
            <SaveToListButton propertyId={property.id} />
            <button type="button" className="btn btn-secondary" onClick={handleShare}>
              {shareCopied ? 'Enlace copiado' : 'Compartir'}
            </button>
            {isStaff && (
              <>
                <Link href={`/admin/propiedades/${property.id}/editar`} className="btn btn-secondary">
                  Editar
                </Link>
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Eliminando…' : 'Eliminar'}
                </button>
              </>
            )}
          </div>
          {isPublished && (
            <>
              {whatsapp && (
                <WhatsAppCta
                  className="btn btn-block"
                  digits={whatsapp}
                  message={whatsappText}
                  propertyId={property.id}
                >
                  WhatsApp con el asesor
                </WhatsAppCta>
              )}
              <h2>Pide una visita</h2>
              <LeadForm propertyId={property.id} />
            </>
          )}
        </aside>
      </div>

      {isPublished && whatsapp && (
        <div className="detail-mobile-cta">
          <div>
            <strong>{listingPrice}</strong>
            {pricePerM2 && <span>{pricePerM2}</span>}
          </div>
          <WhatsAppCta className="btn" digits={whatsapp} message={whatsappText} propertyId={property.id}>
            WhatsApp
          </WhatsAppCta>
        </div>
      )}
    </main>
  );
}
