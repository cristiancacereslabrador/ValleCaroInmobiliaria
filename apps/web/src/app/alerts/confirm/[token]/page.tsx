'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { confirmSavedSearchAlert } from '../../../../lib/api/savedSearchAlerts';
import { ApiError } from '../../../../lib/api/client';

type ConfirmState =
  | { kind: 'loading' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

/**
 * tasks.md 7.1: pagina de confirmacion de alerta, accedida desde el enlace
 * del email de confirmacion (spec.md, Requirement "Confirmacion de la
 * alerta por email (doble opt-in)"). Distingue token invalido (404) de
 * token expirado (410) para mostrar un mensaje mas util en cada caso.
 */
export default function ConfirmSavedSearchAlertPage({ params }: { params: { token: string } }) {
  const [state, setState] = useState<ConfirmState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    confirmSavedSearchAlert(params.token)
      .then((result) => {
        if (!cancelled) setState({ kind: 'success', message: result.message });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 410) {
          setState({
            kind: 'error',
            message: 'Este enlace de confirmación ha expirado. Vuelve a guardar la búsqueda para crear una alerta nueva.',
          });
        } else if (err instanceof ApiError && err.status === 404) {
          setState({ kind: 'error', message: 'Este enlace de confirmación no es válido.' });
        } else {
          setState({ kind: 'error', message: 'No se pudo confirmar la alerta. Inténtalo de nuevo.' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.token]);

  return (
    <main className="page">
      <div className="page-header">
        <h1>Confirmar alerta</h1>
      </div>

      {state.kind === 'loading' && <p className="spinner-text">Confirmando tu alerta…</p>}

      {state.kind === 'success' && <div className="alert alert-info">{state.message}</div>}

      {state.kind === 'error' && <div className="alert alert-error">{state.message}</div>}

      <Link href="/" className="btn btn-secondary">
        Volver al catálogo
      </Link>
    </main>
  );
}
