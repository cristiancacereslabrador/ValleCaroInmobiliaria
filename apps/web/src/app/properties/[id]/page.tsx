'use client';

import { useEffect, useRef, useState } from 'react';
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
import { imageSrcSet, resolveImageUrl, resolveMediaUrl } from '../../../lib/config';
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
import { PhotoCarousel } from '../../../components/PhotoCarousel';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

/**
 * Orden del carrusel: portada, luego los videos (para que se vean pronto) y
 * despues el resto de fotos por posicion.
 */
function orderGallery(media: PropertyMedia[]): PropertyMedia[] {
  const byPosition = (a: PropertyMedia, b: PropertyMedia) => a.position - b.position;
  const photos = media.filter((item) => item.type === MediaType.PHOTO).sort(byPosition);
  const videos = media.filter((item) => item.type === MediaType.VIDEO).sort(byPosition);
  const coverIndex = photos.findIndex((item) => item.isCover);
  const cover = coverIndex >= 0 ? photos.splice(coverIndex, 1) : photos.splice(0, 1);
  return [...cover, ...videos, ...photos];
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [media, setMedia] = useState<PropertyMedia[]>([]);
  const [settings, setSettings] = useState<BrokerSettings | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [lightboxPaused, setLightboxPaused] = useState(false);
  const filmstripRef = useRef<HTMLDivElement>(null);

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

  const galleryItems = orderGallery(media);
  const galleryPhotoCount = galleryItems.length;
  const lightboxIsVideo =
    lightboxIndex !== null && galleryItems[lightboxIndex]?.type === MediaType.VIDEO;

  useEffect(() => {
    if (lightboxIndex === null || galleryPhotoCount < 2 || lightboxPaused || lightboxIsVideo) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setLightboxIndex((index) => (index === null ? 0 : (index + 1) % galleryPhotoCount));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [lightboxIndex, galleryPhotoCount, lightboxPaused, lightboxIsVideo]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setLightboxIndex(null);
        return;
      }
      if (galleryPhotoCount < 2) return;
      if (event.key === 'ArrowLeft') {
        setLightboxIndex((value) =>
          value === null ? 0 : (value + galleryPhotoCount - 1) % galleryPhotoCount,
        );
      }
      if (event.key === 'ArrowRight') {
        setLightboxIndex((value) => (value === null ? 0 : (value + 1) % galleryPhotoCount));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, galleryPhotoCount]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    setPhotoIndex(lightboxIndex);
  }, [lightboxIndex]);

  useEffect(() => {
    // Solo se mueve la tira en horizontal: `scrollIntoView` desplazaba tambien
    // la pagina y, con el carrusel automatico, la devolvia arriba cada 5 s.
    const strip = filmstripRef.current;
    const active = strip?.querySelector<HTMLElement>('.is-on');
    if (!strip || !active) return;
    const stripBox = strip.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    const left =
      strip.scrollLeft + (activeBox.left - stripBox.left) - (stripBox.width - activeBox.width) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [photoIndex]);

  async function handleDelete() {
    if (!property) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteProperty(property.id);
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'No se pudo eliminar la propiedad.');
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
  const galleryPhotos = galleryItems;
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
    { label: 'Construcción', value: property.surfaceM2 ? formatSurface(property.surfaceM2) : null },
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
        <div className="detail-gallery">
          <PhotoCarousel
            variant="hero"
            images={galleryPhotos.map((item, i) =>
              item.type === MediaType.VIDEO
                ? {
                    src: resolveMediaUrl(item.url),
                    videoSrc: resolveMediaUrl(item.url),
                    alt: `${heading}, video`,
                  }
                : {
                    src: resolveImageUrl(item.url, 1080),
                    srcSet: imageSrcSet(item.url, [640, 1080, 1600]),
                    alt: `${heading}, foto ${i + 1}`,
                  },
            )}
            sizes="100vw"
            index={photoIndex}
            onIndexChange={setPhotoIndex}
            paused={lightboxIndex !== null}
            onOpen={setLightboxIndex}
          />
          {galleryPhotos.length > 1 && (
            <div className="photo-filmstrip" ref={filmstripRef} aria-hidden="true">
              {galleryPhotos.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={[i === photoIndex ? 'is-on' : '', item.type === MediaType.VIDEO ? 'is-video' : '']
                    .filter(Boolean)
                    .join(' ') || undefined}
                  onClick={() => setPhotoIndex(i)}
                >
                  {item.type === MediaType.VIDEO ? (
                    <video src={`${resolveMediaUrl(item.url)}#t=0.5`} muted playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(item.url, 320)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {lightboxIndex !== null && galleryPhotos[lightboxIndex] && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Foto de la propiedad"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightboxIndex(null);
          }}
          onMouseEnter={() => setLightboxPaused(true)}
          onMouseLeave={() => setLightboxPaused(false)}
        >
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
          {galleryPhotos[lightboxIndex].type === MediaType.VIDEO ? (
            <video
              key={galleryPhotos[lightboxIndex].id}
              src={resolveMediaUrl(galleryPhotos[lightboxIndex].url)}
              controls
              autoPlay
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImageUrl(galleryPhotos[lightboxIndex].url, 1600)}
              alt={`${heading}, foto ${lightboxIndex + 1} de ${galleryPhotos.length}`}
            />
          )}
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
          {isStaff && (
            <div className="detail-admin-bar">
              <Link href={`/admin/propiedades/${property.id}/editar`} className="btn btn-secondary">
                Editar
              </Link>
              <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                Eliminar propiedad
              </button>
            </div>
          )}

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
              <h2>Comodidades</h2>
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
              <h2>Fotos y videos</h2>
              <MediaUploader propertyId={property.id} onUploaded={(item) => setMedia((prev) => [...prev, item])} />
              <MediaGallery propertyId={property.id} media={media} onChange={setMedia} />
            </div>
          ) : null}

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
                <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                  Eliminar
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
      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar esta propiedad?"
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmDelete(false);
          setDeleteError(null);
        }}
      >
        <p>
          Se borrará <strong>{heading}</strong> con todas sus fotos y videos. Esta acción no se puede
          deshacer.
        </p>
        {deleteError && <div className="alert alert-error">{deleteError}</div>}
      </ConfirmDialog>
    </main>
  );
}
