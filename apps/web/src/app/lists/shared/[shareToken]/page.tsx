'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getSavedPropertyListByShareToken,
  type SavedPropertyListPublicView,
} from '../../../../lib/api/savedPropertyLists';
import { ApiError } from '../../../../lib/api/client';
import { PropertyCard } from '../../../../components/PropertyCard';

/**
 * Página pública de solo lectura de una lista compartida (tasks.md 3.2,
 * spec.md - Requirement "Consultar una lista compartida en modo solo
 * lectura"): accesible por cualquiera con el `shareToken`, sin exponer el
 * `managementToken` ni permitir modificar la lista desde aquí (no hay
 * botones de quitar propiedad, a diferencia de la página de gestión).
 */
export default function SharedSavedPropertyListPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const [list, setList] = useState<SavedPropertyListPublicView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getSavedPropertyListByShareToken(params.shareToken)
      .then((data) => {
        if (!cancelled) setList(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? 'Este enlace de lista compartida no existe o ya no está disponible.'
              : 'No se pudo cargar la lista.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.shareToken]);

  if (isLoading) {
    return (
      <main className="page">
        <p className="spinner-text">Cargando lista…</p>
      </main>
    );
  }

  if (error || !list) {
    return (
      <main className="page">
        <div className="alert alert-error">{error ?? 'Lista no encontrada.'}</div>
        <Link href="/" className="btn btn-secondary">
          Ir al catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="saved-list-header">
        <div>
          <h1>{list.name}</h1>
          <p className="spinner-text">
            {list.properties.length}{' '}
            {list.properties.length === 1 ? 'propiedad' : 'propiedades'} · lista compartida de
            solo lectura
          </p>
        </div>
      </div>

      {list.properties.length === 0 ? (
        <div className="empty-state">Esta lista todavía no tiene propiedades.</div>
      ) : (
        <div className="property-grid">
          {list.properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </main>
  );
}
