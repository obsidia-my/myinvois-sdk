import { SubmitDocumentsApi } from '../../../src/api/einvoice/SubmitDocumentsApi';
import { HttpClient } from '../../../src/client/http/HttpClient';

describe('SubmitDocumentsApi', () => {
  it('POSTs to /api/v1.0/documentsubmissions/', async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fakeFetch: typeof fetch = (async (input: unknown, init?: RequestInit) => {
      captured = { url: String(input), init: init ?? {} };
      return new Response(
        JSON.stringify({ submissionUid: 'S-1', acceptedDocuments: [], rejectedDocuments: [] }),
        { status: 202, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;

    const http = new HttpClient({
      baseUrl: 'https://example.test',
      getToken: async () => 'tok',
      fetchImpl: fakeFetch,
      retries: 0,
    });
    const api = new SubmitDocumentsApi(http);
    const r = await api.submit({ documents: [] });
    expect(r.submissionUid).toBe('S-1');
    expect(captured!.url).toBe('https://example.test/api/v1.0/documentsubmissions/');
    expect(captured!.init.method).toBe('POST');
  });
});
