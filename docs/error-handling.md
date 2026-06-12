# Error Handling

---

## Error types

The SDK throws typed errors so you can handle each failure mode explicitly.

```typescript
import {
  ValidationError,
  AuthError,
  RateLimitError,
  ApiError,
} from '@obsidia-my/myinvois-sdk';
```

---

### ValidationError

Thrown by `.build()` when your document fails schema validation. Contains a list of all violations.

```typescript
try {
  const doc = builder.build();
} catch (e) {
  if (e instanceof ValidationError) {
    for (const field of e.fields) {
      console.error(`${field.field}: ${field.message}`);
    }
    // e.g.
    // "supplier.address.postalZone: must be a 5-digit postcode"
    // "lines[0].subtotal: must equal quantity × unitPrice"
  }
}
```

**Common causes:**

| Error | Fix |
|---|---|
| `issueDate: invalid format` | Use `YYYY-MM-DD`, e.g. `'2024-01-15'` |
| `issueTime: invalid format` | Use `HH:MM:SSZ`, e.g. `'08:30:00Z'` |
| `supplier.address.countrySubentityCode: invalid state` | See state codes in [Codes Reference](codes-reference.md) |
| `currency: exchange rate required for non-MYR` | Add `.currency('USD', 4.72)` with the rate |
| `lines[0].subtotal: must equal quantity × unitPrice` | Check rounding — tolerance is ±0.01 |
| `lines[0].taxCategory.exemptionReason: required when taxType is E` | Add `exemptionReason` field |

---

### AuthError

Thrown when authentication fails. This can mean:

- Invalid `clientId` or `clientSecret`
- Token has been revoked
- You received a 401 from an API endpoint (token was rejected server-side)

The SDK automatically calls `tokenManager.invalidate()` on 401 so the next request will attempt a fresh token fetch.

```typescript
try {
  const result = await client.submit(invoice);
} catch (e) {
  if (e instanceof AuthError) {
    console.error('Authentication failed:', e.message);
    // Check your clientId, clientSecret, and TIN in .env
  }
}
```

---

### RateLimitError

Thrown when the SDK has exhausted its automatic retry attempts after receiving 429 responses.

The SDK automatically handles the first few 429s:
1. Reads the `Retry-After` header from LHDN
2. Waits exactly that many seconds
3. Retries the request

If LHDN keeps returning 429 after retries, `RateLimitError` is thrown.

```typescript
try {
  await client.submit(invoice);
} catch (e) {
  if (e instanceof RateLimitError) {
    console.error('Rate limit exceeded — slow down submission rate');
    // LHDN limits: 100 submissions/minute per client_id
  }
}
```

**Practical tip:** Use `submitBatch()` to spread large volumes over time rather than firing hundreds of parallel requests.

---

### ApiError

Thrown for any other non-successful HTTP response (4xx/5xx) that the SDK does not automatically handle.

```typescript
try {
  await client.submit(invoice);
} catch (e) {
  if (e instanceof ApiError) {
    console.error('API error:', e.status, e.message);
    console.error('Details:', e.details);   // parsed error body from LHDN
  }
}
```

The SDK automatically retries on 5xx errors with exponential backoff (up to 3 attempts: 1s, 2s, 4s). `ApiError` is only thrown after all retries are exhausted.

---

## Retry behaviour summary

| HTTP Status | SDK behaviour |
|---|---|
| 401 Unauthorized | Invalidates token, throws `AuthError` |
| 429 Too Many Requests | Reads `Retry-After`, waits, retries; throws `RateLimitError` if exhausted |
| 500 / 502 / 503 | Exponential backoff (1s → 2s → 4s); throws `ApiError` if exhausted |
| 400 / 404 / 422 | Throws `ApiError` immediately (no retry — request is fundamentally wrong) |
| 204 No Content | Returns `undefined` (normal for cancel/reject endpoints) |

---

## LHDN-level rejection vs SDK error

A document can be **accepted** at the HTTP level (202) but **rejected** at the LHDN validation level after async processing. This is not an SDK error — it shows up in the polling result:

```typescript
const status = await client.getSubmission(submissionUid);

if (status.overallStatus === 'invalid') {
  for (const doc of status.documentSummary) {
    if (doc.status === 'Invalid') {
      console.error('LHDN rejected:', doc.internalId);
      console.error('Reason:', doc.validationResults);
    }
  }
}
```

Common LHDN rejection reasons:
- TIN does not match the certificate's `organizationIdentifier`
- Supplier TIN is not registered for e-Invoice
- Document amount mismatch
- Missing mandatory fields in UBL structure

---

## Recommended error handling pattern

```typescript
import {
  MyInvoisClient,
  ValidationError,
  AuthError,
  RateLimitError,
  ApiError,
} from '@obsidia-my/myinvois-sdk';

async function submitInvoice(client: MyInvoisClient, invoice) {
  try {
    const doc = invoice.build();            // throws ValidationError
    const result = await client.submit(doc);

    // Poll until LHDN finishes validation
    let status = await client.getSubmission(result.submissionUid);
    while (status.overallStatus === 'in progress') {
      await new Promise(r => setTimeout(r, 3000));
      status = await client.getSubmission(result.submissionUid);
    }

    if (status.overallStatus === 'invalid') {
      throw new Error(`LHDN rejected: ${JSON.stringify(status.documentSummary)}`);
    }

    return status;

  } catch (e) {
    if (e instanceof ValidationError) {
      // Document is malformed — fix your data before retrying
      throw e;
    }
    if (e instanceof AuthError) {
      // Bad credentials — alert ops, do not auto-retry
      throw e;
    }
    if (e instanceof RateLimitError) {
      // Back off and queue the submission for later
      throw e;
    }
    if (e instanceof ApiError) {
      // Unexpected API error — log and alert
      console.error('Unexpected API error', e.status, e.message);
      throw e;
    }
    throw e;
  }
}
```
