'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '../../../../../components/AdminGuard';
import { getProperty } from '../../../../../lib/api/properties';
import type { Property } from '../../../../../lib/api/types';
import { ApiError } from '../../../../../lib/api/client';
import { PropertyForm } from '../../../../../components/PropertyForm';

export default function AdminEditPropertyPage({ params }: { params: { id: string } }) {
  return (
    <AdminGuard>
      <AdminEditProperty id={params.id} />
    </AdminGuard>
  );
}

function AdminEditProperty({ id }: { id: string }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getProperty(id)
      .then((data) => {
        if (!cancelled) setProperty(data);
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
  }, [id]);

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
        <Link href="/admin" className="btn btn-secondary">
          Volver al panel
        </Link>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>Editar propiedad</h1>
      </div>
      <div className="section">
        <PropertyForm mode="edit" propertyId={property.id} initialProperty={property} />
      </div>
    </main>
  );
}
