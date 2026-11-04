'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '../../components/AdminGuard';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { deleteProperty, listAdminProperties, updatePropertyStatus } from '../../lib/api/properties';
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
  const [toDelete, setToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!toDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProperty(toDelete.id);
      setProperties((prev) => prev.filter((item) => item.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'No se pudo eliminar la propiedad.');
    } finally {
      setIsDeleting(false);
    }
  }

  const toDeleteTitle = toDelete
    ? toDelete.title?.trim() || propertyTypeLabel(toDelete.type)
    : '';

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
                    <td className="admin-cell-title">
                      <Link href={`/properties/${property.id}`}>{title}</Link>
                    </td>
                    <td data-label="Tipo">{propertyTypeLabel(property.type)}</td>
                    <td data-label="Operación">{operationTypeLabel(property.operationType)}</td>
                    <td data-label="Precio">{formatPrice(property.price)}</td>
                    <td data-label="Estado">{listingStatusLabel(property.listingStatus)}</td>
                    <td className="admin-cell-actions">
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
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={busy}
                          onClick={() => {
                            setDeleteError(null);
                            setToDelete(property);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar esta propiedad?"
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      >
        <p>
          Se borrará <strong>{toDeleteTitle}</strong> con todas sus fotos y videos. Esta acción no se
          puede deshacer.
        </p>
        {deleteError && <div className="alert alert-error">{deleteError}</div>}
      </ConfirmDialog>
    </main>
  );
}
