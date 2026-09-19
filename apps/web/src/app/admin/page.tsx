'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '../../components/AdminGuard';
import { listAdminProperties, updatePropertyStatus } from '../../lib/api/properties';
import { ListingStatus, type Property } from '../../lib/api/types';
import { ApiError } from '../../lib/api/client';
import {
  formatPrice,
  listingStatusLabel,
  operationTypeLabel,
  propertyTypeLabel,
} from '../../lib/format';

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}

function AdminDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function reload() {
    setIsLoading(true);
    setError(null);
    return listAdminProperties()
      .then(setProperties)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el listado.');
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleStatus(id: string, listingStatus: ListingStatus) {
    setPendingId(id);
    setError(null);
    try {
      const updated = await updatePropertyStatus(id, listingStatus);
      setProperties((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>Mis propiedades</h1>
        <Link href="/admin/propiedades/nueva" className="btn">
          + Nueva propiedad
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {isLoading ? (
        <p className="spinner-text">Cargando propiedades…</p>
      ) : properties.length === 0 ? (
        <div className="empty-state">Todavía no hay propiedades. Crea la primera.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Operación</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => {
                const title = property.title?.trim() || propertyTypeLabel(property.type);
                const busy = pendingId === property.id;
                return (
                  <tr key={property.id}>
                    <td>
                      <Link href={`/properties/${property.id}`}>{title}</Link>
                    </td>
                    <td>{propertyTypeLabel(property.type)}</td>
                    <td>{operationTypeLabel(property.operationType)}</td>
                    <td>{formatPrice(property.price)}</td>
                    <td>{listingStatusLabel(property.listingStatus)}</td>
                    <td>
                      <div className="admin-row-actions">
                        {property.listingStatus !== ListingStatus.PUBLISHED && (
                          <button
                            type="button"
                            className="btn"
                            disabled={busy}
                            onClick={() => handleStatus(property.id, ListingStatus.PUBLISHED)}
                          >
                            Publicar
                          </button>
                        )}
                        {property.listingStatus === ListingStatus.PUBLISHED && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={busy}
                            onClick={() => handleStatus(property.id, ListingStatus.PAUSED)}
                          >
                            Pausar
                          </button>
                        )}
                        {property.listingStatus === ListingStatus.PAUSED && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={busy}
                            onClick={() => handleStatus(property.id, ListingStatus.DRAFT)}
                          >
                            A borrador
                          </button>
                        )}
                        <Link
                          href={`/admin/propiedades/${property.id}/editar`}
                          className="btn btn-secondary"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
