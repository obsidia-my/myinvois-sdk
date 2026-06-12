# Authentication

The SDK handles authentication automatically. You never need to call a login method manually.

---

## How it works

MyInvois uses **OAuth 2.0 Client Credentials** flow. The SDK's `TokenManager`:

1. Fetches a token on the first API call
2. Caches it for its lifetime (3600 seconds / 1 hour)
3. Proactively refreshes **5 minutes before expiry** — so your token is never stale mid-request
4. Deduplicates concurrent refresh calls — if 10 requests fire at once when the token is expiring, only one refresh request is made; the other 9 wait for it

You never see any of this. Just call API methods and the SDK handles the rest.

---

## Taxpayer mode (default)

Standard configuration where your system acts as the taxpayer:

```typescript
const client = new MyInvoisClient({
  environment: 'sandbox',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tin: 'C20830570210',          // your TIN
  certificate: { cert, privateKey },
});
```

The token request uses:
```
client_id = {TIN}_{clientId}   → e.g. C20830570210_your-client-id
```

---

## Intermediary mode

If your system submits invoices **on behalf of another taxpayer** (e.g. you're a software vendor or accounting bureau):

```typescript
const client = new MyInvoisClient({
  environment: 'sandbox',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tin: 'C99999999999',              // YOUR company TIN (the intermediary)
  intermediary: {
    tin: 'C99999999999',            // YOUR TIN
    onBehalfOfTin: 'C20830570210',  // the TAXPAYER you're acting for
  },
  certificate: { cert, privateKey },
});
```

The SDK adds the `onbehalfof: {taxpayer_TIN}` header to the token request automatically.

Each taxpayer you act for needs their own client instance.

---

## Manual token invalidation

If you receive a 401 from the API (the SDK does this automatically on 401), you can also manually clear the cached token:

```typescript
// The SDK calls this internally on 401 — you don't need to call it yourself.
// But it's available if you need it:
client['tokenManager'].invalidate();
```

---

## Token endpoint URLs

| Environment | Token URL |
|---|---|
| Sandbox | `https://preprod.myinvois.hasil.gov.my/connect/token` |
| Production | `https://myinvois.hasil.gov.my/connect/token` |

---

## Scope

The SDK requests the `InvoicingAPI` scope, which is the only scope required for all MyInvois operations.
