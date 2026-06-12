import { TokenManager } from '../../../src/client/auth/TokenManager';

function makeFetch(responder: () => { status: number; body: unknown }): typeof fetch {
  return (async () => {
    const { status, body } = responder();
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
}

describe('TokenManager', () => {
  it('fetches and caches token', async () => {
    let calls = 0;
    const tm = new TokenManager({
      tokenUrl: 'https://example.test/connect/token',
      clientId: 'cid',
      clientSecret: 'sec',
      tin: 'T1',
      fetchImpl: makeFetch(() => {
        calls++;
        return { status: 200, body: { access_token: 'abc', token_type: 'Bearer', expires_in: 3600 } };
      }),
    });
    const a = await tm.getValidToken();
    const b = await tm.getValidToken();
    expect(a).toBe('abc');
    expect(b).toBe('abc');
    expect(calls).toBe(1);
  });

  it('deduplicates concurrent refreshes', async () => {
    let calls = 0;
    const tm = new TokenManager({
      tokenUrl: 'https://example.test/connect/token',
      clientId: 'cid',
      clientSecret: 'sec',
      tin: 'T1',
      fetchImpl: makeFetch(() => {
        calls++;
        return { status: 200, body: { access_token: 'tok', token_type: 'Bearer', expires_in: 3600 } };
      }),
    });
    const [a, b, c] = await Promise.all([
      tm.getValidToken(),
      tm.getValidToken(),
      tm.getValidToken(),
    ]);
    expect([a, b, c]).toEqual(['tok', 'tok', 'tok']);
    expect(calls).toBe(1);
  });

  it('throws AuthError on failed token request', async () => {
    const tm = new TokenManager({
      tokenUrl: 'https://example.test/connect/token',
      clientId: 'cid',
      clientSecret: 'sec',
      tin: 'T1',
      fetchImpl: makeFetch(() => ({ status: 400, body: { error: 'bad' } })),
    });
    await expect(tm.getValidToken()).rejects.toThrow(/Token request failed/);
  });
});
