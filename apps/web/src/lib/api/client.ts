import { getApiBaseUrl } from '../config';

/**
 * Forma habitual de un error de NestJS (ValidationPipe / HttpException):
 * `{ statusCode, message: string | string[], error }`. `message` es un
 * array cuando viene de class-validator (uno por campo invalido).
 */
interface NestErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as NestErrorBody;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}

async function parseResponseBody(res: Response): Promise<unknown> {
  if (res.status === 204) {
    return undefined;
  }
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

interface JsonRequestOptions extends Omit<RequestInit, 'body'> {
  json?: unknown;
}

/**
 * Cliente HTTP tipado hacia la API (tasks.md 6.1). Centraliza la URL base,
 * la serializacion JSON y el mapeo de errores de NestJS a `ApiError` para
 * que el resto del frontend no repita ese boilerplate.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch<T>(path: string, options: JsonRequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const method = (rest.method ?? 'GET').toUpperCase();
  const attempts = method === 'GET' || method === 'HEAD' ? 3 : 1;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(`${getApiBaseUrl()}${path}`, {
        ...rest,
        credentials: 'include',
        headers: {
          ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        body: json !== undefined ? JSON.stringify(json) : undefined,
      });

      const body = await parseResponseBody(res);

      if (!res.ok) {
        throw new ApiError(extractMessage(body, res.statusText), res.status, body);
      }

      return body as T;
    } catch (err) {
      lastError = err;
      const retryable = !(err instanceof ApiError) && attempt < attempts;
      if (!retryable) {
        throw err;
      }
      await sleep(400 * attempt);
    }
  }

  throw lastError;
}

/** Subida multipart/form-data (property-media). No fija Content-Type: el navegador añade el boundary. */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  const body = await parseResponseBody(res);

  if (!res.ok) {
    throw new ApiError(extractMessage(body, res.statusText), res.status, body);
  }

  return body as T;
}
