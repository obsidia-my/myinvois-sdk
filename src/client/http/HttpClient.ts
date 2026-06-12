import { ApiError } from '../../errors/ApiError';
import { AuthError } from '../../errors/AuthError';
import { RateLimitError } from '../../errors/RateLimitError';
import type { HttpClientConfig, RequestOptions } from './types';

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRIES = 3;

export class HttpClient {
  constructor(private readonly config: HttpClientConfig) {}

  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, opts);
  }

  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, opts);
  }

  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, opts);
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    opts?: RequestOptions,
  ): Promise<T> {
    const fetchImpl = this.config.fetchImpl ?? fetch;
    const maxRetries = this.config.retries ?? DEFAULT_RETRIES;

    const url = this.buildUrl(path, opts?.query);
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      const token = await this.config.getToken();
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(opts?.headers ?? {}),
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeout ?? DEFAULT_TIMEOUT);

      try {
        if (this.config.debug) {
          // eslint-disable-next-line no-console
          console.debug(`[myinvois-sdk] ${method} ${url}`);
        }
        const init: RequestInit = { method, headers, signal: controller.signal };
        if (body !== undefined) init.body = JSON.stringify(body);
        const res = await fetchImpl(url, init);
        clearTimeout(timer);

        if (res.status === 401) {
          this.config.onUnauthorized?.();
          throw new AuthError('Unauthorized');
        }
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('Retry-After') ?? '1');
          if (attempt < maxRetries) {
            await delay(retryAfter * 1000);
            attempt++;
            continue;
          }
          throw new RateLimitError(retryAfter);
        }
        if (res.status >= 500 && attempt < maxRetries) {
          await delay(backoffMs(attempt));
          attempt++;
          continue;
        }
        if (!res.ok) {
          const errBody = await safeJson(res);
          const e = errBody?.error;
          const code = typeof e?.code === 'string' ? e.code : `HTTP_${res.status}`;
          const msg = typeof e?.message === 'string' ? e.message : res.statusText;
          const details = Array.isArray(e?.details)
            ? (e.details as import('../../errors/MyInvoisError').ErrorDetail[])
            : undefined;
          throw new ApiError(msg, code, res.status, details);
        }
        if (res.status === 204) return undefined as T;
        const ct = res.headers.get('content-type') ?? '';
        if (ct.includes('application/json')) {
          return (await res.json()) as T;
        }
        return (await res.text()) as unknown as T;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof ApiError || err instanceof AuthError || err instanceof RateLimitError) {
          throw err;
        }
        lastError = err;
        if (attempt < maxRetries) {
          await delay(backoffMs(attempt));
          attempt++;
          continue;
        }
        throw err;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Request failed');
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    if (!query) return `${base}${p}`;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `${base}${p}?${qs}` : `${base}${p}`;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000);
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

async function safeJson(res: Response): Promise<ErrorBody | null> {
  try {
    return (await res.json()) as ErrorBody;
  } catch {
    return null;
  }
}
