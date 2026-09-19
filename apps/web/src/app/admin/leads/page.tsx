'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '../../../components/AdminGuard';
import { listAdminLeads } from '../../../lib/api/leads';
import type { PropertyLead } from '../../../lib/api/types';
import { ApiError } from '../../../lib/api/client';
import { propertyTypeLabel } from '../../../lib/format';

export default function AdminLeadsPage() {
  return (
    <AdminGuard>
      <LeadsInbox />
    </AdminGuard>
  );
}

function LeadsInbox() {
  const [leads, setLeads] = useState<PropertyLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAdminLeads()
      .then((data) => {
        if (!cancelled) setLeads(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los leads.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page">
      <div className="page-header">
        <h1>Leads</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {isLoading ? (
        <p className="spinner-text">Cargando mensajes…</p>
      ) : leads.length === 0 ? (
        <div className="empty-state">Todavía no hay mensajes de interesados.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Propiedad</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const propertyLabel =
                  lead.property?.title?.trim() ||
                  (lead.property ? propertyTypeLabel(lead.property.type) : lead.propertyId);
                const contact = [lead.email, lead.phone].filter(Boolean).join(' · ') || '—';
                return (
                  <tr key={lead.id}>
                    <td>{new Date(lead.createdAt).toLocaleString('es-VE')}</td>
                    <td>
                      <Link href={`/properties/${lead.propertyId}`}>{propertyLabel}</Link>
                    </td>
                    <td>{lead.name}</td>
                    <td>{contact}</td>
                    <td>{lead.message}</td>
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
