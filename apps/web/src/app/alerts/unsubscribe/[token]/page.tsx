'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { unsubscribeSavedSearchAlert } from '../../../../lib/api/savedSearchAlerts';
import { ApiError } from '../../../../lib/api/client';

type UnsubscribeState =
  | { kind: 'loading' }
  | { kind: 'done'; message: string; alreadyUnsubscribed: boolean }
  | { kind: 'error'; message: string };

/**
 * tasks.md 7.2: pagina de baja de alerta, accedida desde el enlace de baja
 * incluido en cualquier email relacionado (spec.md, Requirement "Baja de
 * una alerta sin necesidad de cuenta"). Un enlace ya usado no es un error
 * (Scenario "Enlace de baja ya usado"): se informa igual, sin alarmar al
 * usuario.
 */
export default function UnsubscribeSavedSearchAlertPage({ params }: { params: { token: string } }) {
  const [state, setState] = useState<UnsubscribeState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    unsubscribeSavedSearchAlert(params.token)
      .then((result) => {
        if (!cancelled) {
          setState({ kind: 'done', message: result.message, alreadyUnsubscribed: result.alreadyUnsubscribed });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          kind: 'error',
          message:
            err instanceof ApiError && err.status === 404
              ? 'Este enlace de baja no es válido.'
              : 'No se pudo procesar la baja. Inténtalo de nuevo.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [params.token]);

  return (
    <main className="page">
      <div className="page-header">
        <h1>Baja de alerta</h1>
      </div>

      {state.kind === 'loading' && <p className="spinner-text">Procesando la baja…</p>}

      {state.kind === 'done' && <div className="alert alert-info">{state.message}</div>}

      {state.kind === 'error' && <div className="alert alert-error">{state.message}</div>}

      <Link href="/" className="btn btn-secondary">
        Volver al catálogo
      </Link>
    </main>
  );
}
