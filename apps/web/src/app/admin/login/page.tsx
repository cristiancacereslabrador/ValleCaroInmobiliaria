'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, login } from '../../../lib/api/auth';
import { ApiError } from '../../../lib/api/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then(() => {
        if (!cancelled) router.replace('/admin');
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (checking) {
    return (
      <main className="page">
        <p className="spinner-text">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>Acceso del administrador</h1>
      </div>
      <div className="section">
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="login-email">Usuario</label>
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
