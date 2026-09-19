'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '../lib/api/auth';
import { ApiError } from '../lib/api/client';

/**
 * Protege las rutas /admin: si no hay sesión de staff, redirige al login.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then(() => {
        if (!cancelled) setAllowed(true);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace('/admin/login');
          return;
        }
        router.replace('/admin/login');
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!allowed) {
    return (
      <main className="page">
        <p className="spinner-text">Comprobando sesión…</p>
      </main>
    );
  }

  return <>{children}</>;
}
