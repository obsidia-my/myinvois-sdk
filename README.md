# @obsidia-my/myinvois-sdk

TypeScript SDK for Malaysia's **MyInvois e-Invoice system** (LHDN / Lembaga Hasil Dalam Negeri Malaysia).

Handles UBL 2.1 document generation, XAdES digital signing, automatic OAuth token management, batch submission, and the full MyInvois API — so you can integrate in an afternoon instead of a fortnight.

Maintained by [Obsidia System Sdn Bhd](https://obsidia.my).

---

## Status

| | |
|---|---|
| Node.js | 18+ |
| TypeScript | Strict mode, full types |
| Tests | 58 unit tests passing |
| Build | CJS + ESM + `.d.ts` |
| Sandbox verified | Pending — see [Sandbox verification](#sandbox-verification) |

---

## Install

```bash
npm install @obsidia-my/myinvois-sdk
```

---

## Quick start

```typescript
import { MyInvoisClient } from '@obsidia-my/myinvois-sdk';
import fs from 'node:fs';

const client = new MyInvoisClient({
  environment: 'sandbox',           // or 'production'
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tin: 'C20830570210',
  certificate: {
    cert: fs.readFileSync('cert.pem', 'utf8'),
    privateKey: fs.readFileSync('key.pem', 'utf8'),
  },
});

// Build an invoice
const invoice = client.invoice()
  .id('INV-2024-001')
  .issueDate('2024-01-15')
  .issueTime('08:30:00Z')
  .currency('MYR')
  .supplier({
    tin: 'C20830570210',
    identificationNumber: '202001234567',
    identificationType: 'BRN',
    name: 'My Company Sdn Bhd',
    address: {
      addressLines: ['No. 1, Jalan Example'],
      cityName: 'Kuala Lumpur',
      postalZone: '50000',
      countrySubentityCode: '14',   // Wilayah Persekutuan KL
      countryCode: 'MYS',
    },
    msicCode: '62010',
    businessActivityDescription: 'Computer programming activities',
  })
  .buyer({
    tin: 'C12345678901',
    identificationNumber: '202005987654',
    identificationType: 'BRN',
    name: 'Client Company Sdn Bhd',
    address: {
      addressLines: ['No. 5, Jalan Client'],
      cityName: 'Petaling Jaya',
      postalZone: '47500',
      countrySubentityCode: '10',   // Selangor
      countryCode: 'MYS',
    },
  })
  .addLine({
    id: '1',
    description: 'Software Development Services',
    quantity: 1,
    unitCode: 'HUR',
    unitPrice: 5000.00,
    subtotal: 5000.00,
    taxCategory: {
      taxType: '02',        // Service Tax
      taxRate: 8,
      taxableAmount: 5000.00,
      taxAmount: 400.00,
    },
  })
  .totals({
    lineExtensionAmount: 5000.00,
    taxExclusiveAmount: 5000.00,
    taxInclusiveAmount: 5400.00,
    payableAmount: 5400.00,
  })
  .build();

// Submit (signs automatically)
const result = await client.submit(invoice);
console.log('Submission UID:', result.submissionUid);

// Poll for validation result
const status = await client.getSubmission(result.submissionUid);
console.log('Status:', status.overallStatus);
```

---

## Documentation

| Guide | Description |
|---|---|
| [Getting Started](docs/getting-started.md) | Credentials, certificates, first submission |
| [Authentication](docs/authentication.md) | OAuth flow, token refresh, intermediary mode |
| [Building Documents](docs/building-documents.md) | Invoice, credit/debit/refund notes, all fields |
| [Digital Signing](docs/digital-signing.md) | XAdES, certificates, how signing works |
| [Submission](docs/submission.md) | Submit, batch, poll, cancel, reject |
| [Error Handling](docs/error-handling.md) | Error types, retries, rate limits |
| [Codes Reference](docs/codes-reference.md) | State codes, tax types, MSIC, UOM, classification |

---

## Features

- **Fluent document builders** — `client.invoice()`, `client.creditNote()`, `client.debitNote()`, `client.refundNote()`, `client.selfBilledInvoice()`
- **UBL 2.1 serialisation** — JSON and XML formats
- **XAdES digital signing** — RSA-SHA256, exc-c14n, embedded UBLExtensions per LHDN spec
- **Pre-submission validation** — catches state code `00`, missing exchange rate (MYR rule), date formats, postcode format, line arithmetic, tax exemption reason
- **Automatic token refresh** — refreshes 5 minutes before expiry, deduplicates concurrent refresh calls
- **Retry and rate limit handling** — 429 respects `Retry-After` header, 5xx retries with exponential backoff
- **Full API coverage** — submit, cancel, reject, get document, get submission, search, recent, validate TIN, search TIN, QR code, document types, notifications
- **Intermediary mode** — act on behalf of another taxpayer with `onBehalfOf`
- **Bundled reference codes** — all LHDN state codes, tax types, payment modes, MSIC codes, unit codes, classification codes, country codes, currency codes

---

## API overview

```typescript
class MyInvoisClient {
  // Document builders (fluent)
  invoice(): InvoiceBuilder
  creditNote(): CreditNoteBuilder
  debitNote(): DebitNoteBuilder
  refundNote(): RefundNoteBuilder
  selfBilledInvoice(): SelfBilledInvoiceBuilder

  // Submission
  submit(doc: BaseDocument | BaseDocument[]): Promise<SubmissionResult>
  submitBatch(docs: BaseDocument[]): Promise<SubmissionResult[]>  // auto-chunks at 100

  // Document lifecycle
  cancelDocument(uuid: string, reason: string): Promise<void>
  rejectDocument(uuid: string, reason: string): Promise<void>

  // Retrieval
  getSubmission(uid: string): Promise<SubmissionStatus>
  getDocument(uuid: string): Promise<DocumentSource>
  getDocumentDetails(uuid: string): Promise<DocumentDetails>
  getRecentDocuments(params?): Promise<DocumentList>
  searchDocuments(params): Promise<DocumentList>

  // Taxpayer utilities
  validateTin(tin, idType, idValue): Promise<boolean>
  searchTin(params): Promise<TaxpayerInfo[]>
  getQrCodeInfo(token): Promise<TaxpayerInfo>

  // Platform
  getDocumentTypes(): Promise<{ result: DocumentType[] }>
  getNotifications(params?): Promise<{ result: Notification[] }>
}
```

---

## Sandbox verification

The SDK is structurally complete and all XAdES output matches the LHDN reference signed XML. End-to-end sandbox verification with real credentials is pending. If you run a successful sandbox submission, please open a PR or issue with the result — it will help everyone.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licence

MIT © Obsidia System Sdn Bhd
