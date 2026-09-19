import { apiFetch } from './client';
import type { BrokerUser } from './types';

export interface LoginResult {
  user: BrokerUser;
}

// POST /api/v1/auth/login — cookie httpOnly broker_session
export function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>('/auth/login', {
    method: 'POST',
    json: { email, password },
  });
}

// POST /api/v1/auth/logout
export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

// GET /api/v1/auth/me
export function getMe(): Promise<BrokerUser> {
  return apiFetch<BrokerUser>('/auth/me');
}
