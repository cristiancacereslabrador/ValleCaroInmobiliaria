'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ListingStatus,
  OperationType,
  PropertyType,
  type CreatePropertyInput,
  type Property,
  type PropertyMedia,
} from '../lib/api/types';
import {
  listingStatusLabel,
  operationTypeLabel,
  PROPERTY_AMENITY_FIELDS,
  propertyTypeLabel,
} from '../lib/format';
import { createProperty, updateProperty } from '../lib/api/properties';
import { ApiError } from '../lib/api/client';
import { MediaUploader } from './MediaUploader';
import { MediaGallery } from './MediaGallery';

/** '' = no indicado. */
type TriStateFormValue = '' | 'true' | 'false';

type AmenityKey = (typeof PROPERTY_AMENITY_FIELDS)[number]['key'];

type FormState = {
  type: PropertyType | '';
  operationType: OperationType | '';
  listingStatus: ListingStatus;
  title: string;
  description: string;
  price: string;
  surfaceM2: string;
  landSurfaceM2: string;
  bedrooms: string;
  bathrooms: string;
  parkingSpaces: string;
  floor: string;
  constructionYear: string;
  status: string;
  address: string;
  state: string;
  municipality: string;
  parish: string;
  urbanization: string;
  latitude: string;
  longitude: string;
  hasElevator: TriStateFormValue;
  needsRenovation: TriStateFormValue;
  city: string;
  postalCode: string;
} & Record<AmenityKey, boolean>;

const EMPTY_AMENITIES = PROPERTY_AMENITY_FIELDS.reduce(
  (acc, { key }) => {
    acc[key] = false;
    return acc;
  },
  {} as Record<AmenityKey, boolean>,
);

const EMPTY_FORM: FormState = {
  type: '',
  operationType: '',
  listingStatus: ListingStatus.PUBLISHED,
  title: '',
  description: '',
  price: '',
  surfaceM2: '',
  landSurfaceM2: '',
  bedrooms: '',
  bathrooms: '',
  parkingSpaces: '',
  floor: '',
  constructionYear: '',
  status: '',
  address: '',
  state: 'Táchira',
  municipality: '',
  parish: '',
  urbanization: '',
  latitude: '',
  longitude: '',
  hasElevator: '',
  needsRenovation: '',
  city: '',
  postalCode: '',
  ...EMPTY_AMENITIES,
};

function toTriStateFormValue(value: boolean | null): TriStateFormValue {
  if (value === null) return '';
  return value ? 'true' : 'false';
}

function toFormState(property: Property): FormState {
  const amenities = PROPERTY_AMENITY_FIELDS.reduce(
    (acc, { key }) => {
      acc[key] = Boolean(property[key]);
      return acc;
    },
    {} as Record<AmenityKey, boolean>,
  );

  return {
    type: property.type,
    operationType: property.operationType,
    listingStatus: property.listingStatus,
    title: property.title ?? '',
    description: property.description ?? '',
    price: property.price ?? '',
    surfaceM2: property.surfaceM2 ?? '',
    landSurfaceM2: property.landSurfaceM2 ?? '',
    bedrooms: property.bedrooms !== null ? String(property.bedrooms) : '',
    bathrooms: property.bathrooms !== null ? String(property.bathrooms) : '',
    parkingSpaces: property.parkingSpaces !== null ? String(property.parkingSpaces) : '',
    floor: property.floor !== null ? String(property.floor) : '',
    constructionYear: property.constructionYear !== null ? String(property.constructionYear) : '',
    status: property.status ?? '',
    address: property.address ?? '',
    state: property.state ?? 'Táchira',
    municipality: property.municipality ?? '',
    parish: property.parish ?? '',
    urbanization: property.urbanization ?? '',
    latitude: property.latitude ?? '',
    longitude: property.longitude ?? '',
    hasElevator: toTriStateFormValue(property.hasElevator),
    needsRenovation: toTriStateFormValue(property.needsRenovation),
    city: property.city ?? '',
    postalCode: property.postalCode ?? '',
    ...amenities,
  };
}

function toBooleanOrUndefined(value: TriStateFormValue): boolean | undefined {
  if (value === '') return undefined;
  return value === 'true';
}

function toNumberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
}

function toOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function buildPayload(form: FormState, includeStatus: boolean): CreatePropertyInput {
  const amenities = PROPERTY_AMENITY_FIELDS.reduce(
    (acc, { key }) => {
      acc[key] = form[key];
      return acc;
    },
    {} as Record<AmenityKey, boolean>,
  );

  return {
    type: form.type as PropertyType,
    operationType: form.operationType as OperationType,
    ...(includeStatus ? { listingStatus: form.listingStatus } : {}),
    title: toOptionalText(form.title),
    description: toOptionalText(form.description),
    price: Number(form.price),
    surfaceM2: toNumberOrUndefined(form.surfaceM2),
    landSurfaceM2: toNumberOrUndefined(form.landSurfaceM2),
    bedrooms: toNumberOrUndefined(form.bedrooms),
    bathrooms: toNumberOrUndefined(form.bathrooms),
    parkingSpaces: toNumberOrUndefined(form.parkingSpaces),
    floor: toNumberOrUndefined(form.floor),
    constructionYear: toNumberOrUndefined(form.constructionYear),
    status: toOptionalText(form.status),
    address: toOptionalText(form.address),
    state: toOptionalText(form.state),
    municipality: toOptionalText(form.municipality),
    parish: toOptionalText(form.parish),
    urbanization: toOptionalText(form.urbanization),
    latitude: toNumberOrUndefined(form.latitude),
    longitude: toNumberOrUndefined(form.longitude),
    hasElevator: toBooleanOrUndefined(form.hasElevator),
    needsRenovation: toBooleanOrUndefined(form.needsRenovation),
    city: toOptionalText(form.city),
    postalCode: toOptionalText(form.postalCode),
    ...amenities,
  };
}

interface PropertyFormProps {
  mode: 'create' | 'edit';
  propertyId?: string;
  initialProperty?: Property;
}

/**
 * Formulario de alta/edición con campos venezolanos (título, geo VE,
 * estacionamiento, amenidades, estado de publicación).
 */
export function PropertyForm({ mode, propertyId, initialProperty }: PropertyFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initialProperty ? toFormState(initialProperty) : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [media, setMedia] = useState<PropertyMedia[]>(initialProperty?.media ?? []);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.type) {
      setError('El tipo de inmueble es obligatorio.');
      return;
    }
    if (!form.operationType) {
      setError('El tipo de operación es obligatorio.');
      return;
    }
    if (form.price.trim() === '') {
      setError('El precio es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload(form, true);
      const property =
        mode === 'create'
          ? await createProperty(payload)
          : await updateProperty(propertyId as string, payload);
      router.push(
        mode === 'create' ? `/admin/propiedades/${property.id}/editar` : '/admin',
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la propiedad.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="type">Tipo de inmueble *</label>
          <select
            id="type"
            value={form.type}
            onChange={(event) => setField('type', event.target.value as PropertyType)}
            required
          >
            <option value="">Selecciona un tipo</option>
            {Object.values(PropertyType).map((type) => (
              <option key={type} value={type}>
                {propertyTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="operationType">Operación *</label>
          <select
            id="operationType"
            value={form.operationType}
            onChange={(event) => setField('operationType', event.target.value as OperationType)}
            required
          >
            <option value="">Selecciona una operación</option>
            {Object.values(OperationType).map((operationType) => (
              <option key={operationType} value={operationType}>
                {operationTypeLabel(operationType)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="listingStatus">Estado de publicación</label>
          <select
            id="listingStatus"
            value={form.listingStatus}
            onChange={(event) => setField('listingStatus', event.target.value as ListingStatus)}
          >
            {Object.values(ListingStatus).map((status) => (
              <option key={status} value={status}>
                {listingStatusLabel(status)}
              </option>
            ))}
          </select>
          <span className="field-hint">
            Borrador y Pausada no salen en el catálogo público. Elige Publicada para que se vea.
          </span>
        </div>

        <div className="field">
          <label htmlFor="price">Precio (USD) *</label>
          <input
            id="price"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(event) => setField('price', event.target.value)}
            required
          />
        </div>

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="title">Título</label>
          <input
            id="title"
            type="text"
            maxLength={150}
            placeholder="p. ej. Quinta en La Concordia con jardín"
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
          />
        </div>

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            rows={5}
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="surfaceM2">Superficie construida (m²)</label>
          <input
            id="surfaceM2"
            type="number"
            min={0}
            step="0.01"
            value={form.surfaceM2}
            onChange={(event) => setField('surfaceM2', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="landSurfaceM2">Superficie de terreno (m²)</label>
          <input
            id="landSurfaceM2"
            type="number"
            min={0}
            step="0.01"
            value={form.landSurfaceM2}
            onChange={(event) => setField('landSurfaceM2', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="bedrooms">Habitaciones</label>
          <input
            id="bedrooms"
            type="number"
            min={0}
            value={form.bedrooms}
            onChange={(event) => setField('bedrooms', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="bathrooms">Baños</label>
          <input
            id="bathrooms"
            type="number"
            min={0}
            value={form.bathrooms}
            onChange={(event) => setField('bathrooms', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="parkingSpaces">Puestos de estacionamiento</label>
          <input
            id="parkingSpaces"
            type="number"
            min={0}
            value={form.parkingSpaces}
            onChange={(event) => setField('parkingSpaces', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="floor">Nivel</label>
          <input
            id="floor"
            type="number"
            value={form.floor}
            onChange={(event) => setField('floor', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="constructionYear">Año de construcción</label>
          <input
            id="constructionYear"
            type="number"
            min={1800}
            max={2100}
            value={form.constructionYear}
            onChange={(event) => setField('constructionYear', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="status">Estado del inmueble</label>
          <input
            id="status"
            type="text"
            placeholder="p. ej. buen estado, a remodelar…"
            value={form.status}
            onChange={(event) => setField('status', event.target.value)}
          />
        </div>

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="address">Dirección</label>
          <input
            id="address"
            type="text"
            placeholder="Se geocodifica automáticamente si no indicas coordenadas"
            value={form.address}
            onChange={(event) => setField('address', event.target.value)}
          />
        </div>

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="urbanization">Zona (urbanización o barrio)</label>
          <input
            id="urbanization"
            type="text"
            placeholder="p. ej. Pirineos, La Concordia, Barrio Obrero, Las Lomas"
            value={form.urbanization}
            onChange={(event) => setField('urbanization', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="state">Estado</label>
          <input
            id="state"
            type="text"
            value={form.state}
            onChange={(event) => setField('state', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="municipality">Municipio</label>
          <input
            id="municipality"
            type="text"
            value={form.municipality}
            onChange={(event) => setField('municipality', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="parish">Parroquia</label>
          <input
            id="parish"
            type="text"
            value={form.parish}
            onChange={(event) => setField('parish', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="city">Ciudad</label>
          <input
            id="city"
            type="text"
            placeholder="San Cristóbal"
            value={form.city}
            onChange={(event) => setField('city', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="postalCode">Código postal</label>
          <input
            id="postalCode"
            type="text"
            value={form.postalCode}
            onChange={(event) => setField('postalCode', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="latitude">Latitud (opcional)</label>
          <input
            id="latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            value={form.latitude}
            onChange={(event) => setField('latitude', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="longitude">Longitud (opcional)</label>
          <input
            id="longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            value={form.longitude}
            onChange={(event) => setField('longitude', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="hasElevator">Ascensor</label>
          <select
            id="hasElevator"
            value={form.hasElevator}
            onChange={(event) => setField('hasElevator', event.target.value as TriStateFormValue)}
          >
            <option value="">Sin especificar</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="needsRenovation">Necesita reforma</label>
          <select
            id="needsRenovation"
            value={form.needsRenovation}
            onChange={(event) =>
              setField('needsRenovation', event.target.value as TriStateFormValue)
            }
          >
            <option value="">Sin especificar</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <fieldset className="amenity-fieldset">
        <legend>Amenidades</legend>
        <div className="amenity-grid">
          {PROPERTY_AMENITY_FIELDS.map(({ key, label }) => (
            <label key={key} className="amenity-check" htmlFor={`amenity-${key}`}>
              <input
                id={`amenity-${key}`}
                type="checkbox"
                checked={form[key]}
                onChange={(event) => setField(key, event.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {mode === 'edit' && propertyId && (
        <div className="section" style={{ marginTop: '1.5rem' }}>
          <h2>Fotos y vídeos</h2>
          <p className="page-subtitle">
            La primera foto se usa como portada. Marca «tour 360°» solo si la imagen es panorámica.
          </p>
          <MediaUploader
            propertyId={propertyId}
            onUploaded={(item) => setMedia((prev) => [...prev, item])}
          />
          <MediaGallery propertyId={propertyId} media={media} onChange={setMedia} />
        </div>
      )}

      {mode === 'create' && (
        <p className="page-subtitle">
          Al crear la ficha pasarás a Editar, donde se suben fotos y vídeos (también desde el teléfono).
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : mode === 'create' ? 'Crear propiedad' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push('/admin')}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
