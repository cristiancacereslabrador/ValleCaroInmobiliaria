'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '../../../components/AdminGuard';
import { listAdminLeads, updateLeadStatus } from '../../../lib/api/leads';
import type { LeadOrigin, LeadStatus, PropertyLead } from '../../../lib/api/types';
import { ApiError } from '../../../lib/api/client';
import { propertyTypeLabel } from '../../../lib/format';

const STATUS_OPTIONS: LeadStatus[] = ['nuevo', 'contactado', 'visita', 'cerrado'];

const ORIGIN_LABELS: Record<LeadOrigin, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
  valuation: 'Tasación',
  sell_form: 'Quiero vender',
};

const INTENT_LABELS: Record<string, string> = {
  buy: 'Comprar',
  rent: 'Alquilar',
  sell: 'Vender',
  visit: 'Visita',
};

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

  async function handleStatusChange(id: string, status: LeadStatus) {
    try {
      const updated = await updateLeadStatus(id, status);
      setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, ...updated } : lead)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el estado.');
    }
  }

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
                <th>Origen</th>
                <th>Estado</th>
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
                  (lead.property ? propertyTypeLabel(lead.property.type) : null);
                const contact = [lead.email, lead.phone].filter(Boolean).join(' · ') || '—';
                return (
                  <tr key={lead.id}>
                    <td>{new Date(lead.createdAt).toLocaleString('es-VE')}</td>
                    <td>
                      <span className={`lead-origin lead-origin-${lead.origin}`}>
                        {ORIGIN_LABELS[lead.origin] ?? lead.origin}
                      </span>
                      {lead.intent && (
                        <span className="lead-intent">{INTENT_LABELS[lead.intent] ?? lead.intent}</span>
                      )}
                    </td>
                    <td>
                      <select
                        className={`lead-status lead-status-${lead.status}`}
                        value={lead.status}
                        onChange={(event) => handleStatusChange(lead.id, event.target.value as LeadStatus)}
                        aria-label={`Estado de ${lead.name}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {lead.propertyId && propertyLabel ? (
                        <Link href={`/properties/${lead.propertyId}`}>{propertyLabel}</Link>
                      ) : (
                        '—'
                      )}
                      {lead.visitAt && (
                        <div className="lead-visit">
                          Visita: {new Date(lead.visitAt).toLocaleString('es-VE')}
                        </div>
                      )}
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
