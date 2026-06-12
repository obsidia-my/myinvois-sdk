import { HttpClient } from '../../../src/client/http/HttpClient';
import { RateLimitError } from '../../../src/errors/RateLimitError';
import { AuthError } from '../../../src/errors/AuthError';
import { ApiError } from '../../../src/errors/ApiError';

type FetchCall = { url: string; method: string };

function makeFetch(responses: Array<() => Response>): { fetch: typeof fetch; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  let idx = 0;
  const fetchFn = async (input: unknown, init?: RequestInit): Promise<Response> => {
    calls.push({ url: String(input), method: (init?.method ?? 'GET') as string });
    const responder = responses[idx++];
    if (responder === undefined) throw new Error('Unexpected fetch call');
    return responder();
  };
  return { fetch: fetchFn as typeof fetch, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function makeClient(fetchFn: typeof fetch, retries = 1): HttpClient {
  return new HttpClient({
    baseUrl: 'https://api.test',
    getToken: async (): Promise<string> => 'test-token',
    fetchImpl: fetchFn,
    retries,
    timeout: 5000,
  });
}

describe('HttpClient', () => {
  describe('GET success', () => {
    it('returns parsed JSON on 200', async () => {
      const { fetch } = makeFetch([() => jsonResponse({ ok: true })]);
      const result = await makeClient(fetch).get<{ ok: boolean }>('/test');
      expect(result.ok).toBe(true);
    });

    it('appends query string params', async () => {
      const { fetch, calls } = makeFetch([() => jsonResponse({})]);
      await makeClient(fetch).get('/docs', { query: { page: 1, status: 'valid' } });
      expect(calls[0]!.url).toContain('?page=1&status=valid');
    });

    it('omits undefined query params', async () => {
      const { fetch, calls } = makeFetch([() => jsonResponse({})]);
      await makeClient(fetch).get('/docs', { query: { page: 1, status: undefined } });
      expect(calls[0]!.url).not.toContain('status');
    });

    it('sends Authorization header', async () => {
      let capturedHeaders: Record<string, string> | undefined;
      const fetchFn: typeof fetch = async (_input, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return jsonResponse({});
      };
      await makeClient(fetchFn).get('/x');
      expect(capturedHeaders?.['Authorization']).toBe('Bearer test-token');
    });
  });

  describe('POST', () => {
    it('sends JSON body', async () => {
      let capturedBody: string | null = null;
      const fetchFn: typeof fetch = async (_input, init) => {
        capturedBody = (init?.body as string) ?? null;
        return jsonResponse({ id: '1' }, 201);
      };
      await makeClient(fetchFn).post('/docs', { name: 'test' });
      expect(JSON.parse(capturedBody!)).toEqual({ name: 'test' });
    });
  });

  describe('error handling', () => {
    it('throws AuthError on 401', async () => {
      const { fetch } = makeFetch([() => new Response('', { status: 401 })]);
      await expect(makeClient(fetch, 0).get('/x')).rejects.toBeInstanceOf(AuthError);
    });

    it('throws ApiError on 400 with error body', async () => {
      const { fetch } = makeFetch([
        () => jsonResponse({ error: { code: 'BadStructure', message: 'bad' } }, 400),
      ]);
      const err = await makeClient(fetch, 0).get('/x').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('BadStructure');
    });

    it('throws ApiError with HTTP code fallback when no error body', async () => {
      const { fetch } = makeFetch([() => new Response('Not Found', { status: 404 })]);
      const err = await makeClient(fetch, 0).get('/x').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('HTTP_404');
    });
  });

  describe('rate limiting (429)', () => {
    it('retries after Retry-After seconds on 429', async () => {
      const { fetch, calls } = makeFetch([
        () => new Response('', { status: 429, headers: { 'Retry-After': '0' } }),
        () => jsonResponse({ ok: true }),
      ]);
      const result = await makeClient(fetch, 1).get<{ ok: boolean }>('/x');
      expect(result.ok).toBe(true);
      expect(calls.length).toBe(2);
    });

    it('throws RateLimitError after exhausting retries on 429', async () => {
      const { fetch } = makeFetch([
        () => new Response('', { status: 429, headers: { 'Retry-After': '0' } }),
        () => new Response('', { status: 429, headers: { 'Retry-After': '60' } }),
      ]);
      const err = await makeClient(fetch, 1).get('/x').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfterSeconds).toBe(60);
    });
  });

  describe('5xx retry', () => {
    it('retries on 500 and succeeds on second attempt', async () => {
      const { fetch, calls } = makeFetch([
        () => new Response('Internal Server Error', { status: 500 }),
        () => jsonResponse({ ok: true }),
      ]);
      const result = await makeClient(fetch, 1).get<{ ok: boolean }>('/x');
      expect(result.ok).toBe(true);
      expect(calls.length).toBe(2);
    });

    it('throws after exhausting retries on repeated 500', async () => {
      const { fetch } = makeFetch([
        () => new Response('', { status: 500 }),
        () => new Response('', { status: 500 }),
      ]);
      const err = await makeClient(fetch, 1).get('/x').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ApiError);
    });
  });

  describe('204 No Content', () => {
    it('returns undefined on 204', async () => {
      const { fetch } = makeFetch([() => new Response(null, { status: 204 })]);
      const result = await makeClient(fetch).put('/docs/state/x/state', { status: 'cancelled' });
      expect(result).toBeUndefined();
    });
  });
});
