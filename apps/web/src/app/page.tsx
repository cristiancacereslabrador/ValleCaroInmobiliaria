'use client';

import { useEffect, useState } from 'react';
import { listProperties } from '../lib/api/properties';
import { searchByCommute, type PropertyWithCommute } from '../lib/api/commuteSearch';
import { getBrokerSettings } from '../lib/api/brokerSettings';
import type { AreaVertex, BrokerSettings, Property, PropertyFilters } from '../lib/api/types';
import { ApiError } from '../lib/api/client';
import { PropertyFiltersBar } from '../components/PropertyFiltersBar';
import { PropertyCard } from '../components/PropertyCard';
import { ListingMap } from '../components/ListingMap';
import { CommuteSearchControl, type CommuteSearchValue } from '../components/CommuteSearchControl';
import { SaveSearchAlertForm } from '../components/SaveSearchAlertForm';
import { SAN_CRISTOBAL_CENTER, SAN_CRISTOBAL_ZOOM } from '../lib/geo';
import { resolveMediaUrl } from '../lib/config';

function isPropertyWithCommute(property: Property): property is PropertyWithCommute {
  return typeof (property as Partial<PropertyWithCommute>).commuteDurationSeconds === 'number';
}

type MobileCatalogView = 'map' | 'list';

export default function CatalogPage() {
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [settings, setSettings] = useState<BrokerSettings | null>(null);

  const [commuteSearch, setCommuteSearch] = useState<CommuteSearchValue | null>(null);
  const [commuteError, setCommuteError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileCatalogView>('list');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  useEffect(() => {
    let cancelled = false;
    getBrokerSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setCommuteError(null);

    const request = commuteSearch
      ? searchByCommute({
          destinationAddress: commuteSearch.destinationAddress,
          transportMode: commuteSearch.transportMode,
          maxDurationMinutes: commuteSearch.maxDurationMinutes,
          type: filters.type,
          operationType: filters.operationType,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          hasElevator: filters.hasElevator,
          groundFloor: filters.groundFloor,
          needsRenovation: filters.needsRenovation,
        }).then((result) => {
          if (result.available) {
            return result.properties;
          }
          setCommuteError(
            'La búsqueda por trayecto no está disponible temporalmente. Puedes seguir usando el resto de filtros del catálogo.',
          );
          return [];
        })
      : listProperties({ ...filters, sortBy });

    request
      .then((data) => {
        if (!cancelled) setProperties(data);
      })
      .catch((err) => {
        if (!cancelled) {
          if (commuteSearch && err instanceof ApiError && err.status === 400) {
            setCommuteError(err.message);
            setProperties([]);
          } else {
            setError(err instanceof ApiError ? err.message : 'No se pudo cargar el listado de propiedades.');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, commuteSearch, reloadKey, sortBy]);

  function handleAreaChange(area: AreaVertex[] | undefined) {
    setFilters((prev) => ({ ...prev, area }));
  }

  const mapCenter =
    settings?.mapCenterLat && settings?.mapCenterLng
      ? { lat: Number(settings.mapCenterLat), lng: Number(settings.mapCenterLng) }
      : SAN_CRISTOBAL_CENTER;
  const mapZoom = settings?.mapZoom ?? SAN_CRISTOBAL_ZOOM;
  const listIsActive = commuteSearch || mobileView === 'list';
  const mapIsActive = !commuteSearch && mobileView === 'map';
  const resultLabel = isLoading
    ? 'Buscando propiedades…'
    : `${properties.length} ${properties.length === 1 ? 'propiedad' : 'propiedades'} en Táchira`;
  const heroPhoto =
    properties.find((item) => item.type === 'quinta' && item.coverPhotoUrl)?.coverPhotoUrl ??
    properties.find((item) => item.coverPhotoUrl)?.coverPhotoUrl;

  return (
    <div className="catalog-page">
      <section
        className="catalog-hero"
        style={
          heroPhoto
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(12, 18, 16, 0.2) 0%, rgba(12, 18, 16, 0.78) 100%), url("${resolveMediaUrl(heroPhoto)}")`,
              }
            : undefined
        }
      >
        <div className="catalog-hero-inner">
          <p className="eyebrow">San Cristóbal · Táchira · Venezuela</p>
          <h1>El próximo capítulo de tu vida, en los Andes.</h1>
          <p className="hero-lead">
            {settings?.slogan?.trim() ||
              'Quintas, apartamentos y locales con fotos reales, datos completos y respuesta directa.'}
          </p>
          <PropertyFiltersBar filters={filters} onChange={setFilters} />
          <ul className="trust-strip">
            <li>Fotos reales y datos completos</li>
            <li>Respuesta directa por WhatsApp</li>
            <li>San Cristóbal y Táchira</li>
          </ul>
        </div>
      </section>

      <main className="page catalog-results">
        <div className="catalog-toolbar">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2>{resultLabel}</h2>
          </div>
          <div className="catalog-toolbar-actions">
            <label className="sort-field">
              <span>Ordenar</span>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as 'newest' | 'price_asc' | 'price_desc')
                }
              >
                <option value="newest">Más recientes</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
              </select>
            </label>
            <div className="catalog-view-toggle" role="group" aria-label="Vista del catálogo">
              <div className="catalog-view-toggle-row">
                <button
                  type="button"
                  className={mobileView === 'list' ? 'btn' : 'btn btn-secondary'}
                  onClick={() => setMobileView('list')}
                >
                  Lista
                </button>
                <button
                  type="button"
                  className={mobileView === 'map' ? 'btn' : 'btn btn-secondary'}
                  onClick={() => setMobileView('map')}
                >
                  Mapa
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}{' '}
            <button type="button" className="btn" onClick={() => setReloadKey((key) => key + 1)}>
              Reintentar
            </button>
          </div>
        )}

        {!error && !commuteSearch && (
          <div className={`catalog-map-pane ${mapIsActive ? 'is-active' : ''}`}>
            <ListingMap
              properties={properties}
              area={filters.area}
              onAreaChange={handleAreaChange}
              defaultCenter={
                Number.isNaN(mapCenter.lat) || Number.isNaN(mapCenter.lng)
                  ? SAN_CRISTOBAL_CENTER
                  : mapCenter
              }
              defaultZoom={mapZoom}
            />
          </div>
        )}

        <div className={`catalog-list-pane ${listIsActive ? 'is-active' : ''}`}>
          {isLoading ? (
            <p className="spinner-text">Cargando propiedades…</p>
          ) : properties.length === 0 ? (
            <div className="empty-state">No hay propiedades que coincidan con los filtros seleccionados.</div>
          ) : (
            <div className="property-grid">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  whatsapp={settings?.whatsapp}
                  commuteDurationMinutes={
                    isPropertyWithCommute(property)
                      ? Math.round(property.commuteDurationSeconds / 60)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        <details className="catalog-tools">
          <summary>Alertas y búsqueda por trayecto</summary>
          <SaveSearchAlertForm filters={filters} />
          <CommuteSearchControl
            active={commuteSearch}
            onSearch={setCommuteSearch}
            onClear={() => setCommuteSearch(null)}
            isLoading={Boolean(commuteSearch) && isLoading}
            error={commuteError}
          />
        </details>
      </main>
    </div>
  );
}
