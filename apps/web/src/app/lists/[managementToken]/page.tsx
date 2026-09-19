'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getSavedPropertyListByManagementToken,
  removePropertyFromSavedList,
  type SavedPropertyListManagementView,
} from '../../../lib/api/savedPropertyLists';
import { ApiError } from '../../../lib/api/client';
import { PropertyCard } from '../../../components/PropertyCard';
import { rememberSavedPropertyList } from '../../../lib/savedListsStorage';

/**
 * Página de gestión de una lista de propiedades guardadas (tasks.md 3.2),
 * accesible con el `managementToken` guardado en `localStorage` del
 * navegador que creó la lista (design.md - Decision 1). Permite ver y quitar
 * propiedades, y copiar el enlace de solo lectura para compartir
 * (spec.md, Requirement "Consultar una lista en modo gestión").
 */
export default function ManageSavedPropertyListPage({
  params,
}: {
  params: { managementToken: string };
}) {
  const [list, setList] = useState<SavedPropertyListManagementView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getSavedPropertyListByManagementToken(params.managementToken)
      .then((data) => {
        if (cancelled) return;
        setList(data);
        // Recuerda/actualiza la referencia local (por si se llego aqui desde
        // un enlace guardado fuera de este navegador, o tras limpiar cache).
        rememberSavedPropertyList({
          id: data.id,
          name: data.name,
          managementToken: data.managementToken,
          shareToken: data.shareToken,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? 'Esta lista no existe o el enlace de gestión no es válido.'
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
  }, [params.managementToken]);

  useEffect(() => {
    if (list && typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/lists/shared/${list.shareToken}`);
    }
  }, [list]);

  async function handleRemove(propertyId: string) {
    if (!list) return;
    setRemovingId(propertyId);
    setError(null);
    try {
      await removePropertyFromSavedList(list.managementToken, propertyId);
      setList({ ...list, properties: list.properties.filter((p) => p.id !== propertyId) });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo quitar la propiedad de la lista.',
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleCopyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard no disponible (navegador antiguo, sin permiso, http sin
      // TLS, etc.): el usuario puede seleccionar y copiar el enlace a mano
      // desde el input de solo lectura.
    }
  }

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
          Volver al catálogo
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
            {list.properties.length === 1 ? 'propiedad guardada' : 'propiedades guardadas'}
          </p>
        </div>
      </div>

      <div className="section">
        <h2>Compartir esta lista</h2>
        <p className="spinner-text">
          Cualquiera con este enlace puede ver las propiedades de la lista, sin poder
          modificarla.
        </p>
        <div className="share-link-box">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.target.select()}
          />
          <button type="button" className="btn btn-secondary" onClick={handleCopyShareLink}>
            {copied ? 'Copiado ✓' : 'Copiar enlace'}
          </button>
        </div>
      </div>

      {list.properties.length === 0 ? (
        <div className="empty-state">Todavía no has añadido propiedades a esta lista.</div>
      ) : (
        <div className="property-grid">
          {list.properties.map((property) => (
            <div key={property.id}>
              <PropertyCard property={property} />
              <div className="saved-list-item-remove">
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={removingId === property.id}
                  onClick={() => handleRemove(property.id)}
                >
                  {removingId === property.id ? 'Quitando…' : 'Quitar de la lista'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
