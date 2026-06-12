# Getting Started

This guide walks you through everything needed to make your first MyInvois submission.

---

## Prerequisites

- Node.js 18 or later
- A Malaysian company registered with LHDN (for production) or a sandbox account (for testing)
- An X.509 digital signing certificate from a MCMC-recognised CA

---

## Step 1 — Get your credentials

### Sandbox (for development)

1. Go to [preprod.myinvois.hasil.gov.my](https://preprod.myinvois.hasil.gov.my)
2. Log in using your **MyTax** credentials (mytax.hasil.gov.my)
3. Navigate to **Profile → Taxpayer Application System**
4. Create a new client application → you receive a `client_id` and `client_secret`

> Your **TIN** (Tax Identification Number) is printed on any LHDN correspondence or visible in MyTax after login. Companies have format `C` + 11 digits (e.g. `C20830570210`).

### Production

Same flow on [myinvois.hasil.gov.my](https://myinvois.hasil.gov.my).

---

## Step 2 — Get a digital certificate

MyInvois requires an **X.509 certificate** with:
- Issued by a MCMC-recognised Malaysian CA
- Key Usage: Non-Repudiation
- Extended Key Usage: Document Signing (`1.3.6.1.4.1.311.10.3.12`)
- Distinguished Name includes: CN (company name), C=MY, O (company name), organizationIdentifier (TIN), serialNumber (BRN)

### For sandbox / testing

LHDN provides trial certificates. Download a sample from the [MyInvois SDK documentation site](https://sdk.myinvois.hasil.gov.my) under the Digital Signature section. These are issued by **Pos Digicert Trial CA** and work for sandbox only.

### For production

Purchase from one of the MCMC-recognised CAs:

| CA | Website |
|---|---|
| Pos Digicert | posdigicert.com.my |
| MSC Trustgate | trustgate.com.my |
| Telekom Applied Business | tab.com.my |

The CA will issue a `.p12` or `.pfx` file. Convert to PEM format:

```bash
# Extract certificate
openssl pkcs12 -in certificate.p12 -nokeys -out cert.pem

# Extract private key (you will be prompted for the p12 password)
openssl pkcs12 -in certificate.p12 -nocerts -nodes -out key.pem
```

---

## Step 3 — Install the SDK

```bash
npm install @obsidia-my/myinvois-sdk
```

---

## Step 4 — Configure the client

```typescript
import { MyInvoisClient } from '@obsidia-my/myinvois-sdk';
import fs from 'node:fs';

const client = new MyInvoisClient({
  environment: 'sandbox',           // 'sandbox' | 'production'
  clientId: 'your-client-id',       // from MyInvois developer portal
  clientSecret: 'your-secret',
  tin: 'C20830570210',              // your company TIN
  certificate: {
    cert: fs.readFileSync('cert.pem', 'utf8'),
    privateKey: fs.readFileSync('key.pem', 'utf8'),
  },
});
```

Store credentials in environment variables — never commit them to source control:

```bash
# .env (add to .gitignore)
MYINVOIS_CLIENT_ID=your-client-id
MYINVOIS_CLIENT_SECRET=your-client-secret
MYINVOIS_TIN=C20830570210
```

```typescript
const client = new MyInvoisClient({
  environment: 'sandbox',
  clientId: process.env.MYINVOIS_CLIENT_ID!,
  clientSecret: process.env.MYINVOIS_CLIENT_SECRET!,
  tin: process.env.MYINVOIS_TIN!,
  certificate: {
    cert: fs.readFileSync(process.env.MYINVOIS_CERT_PATH!, 'utf8'),
    privateKey: fs.readFileSync(process.env.MYINVOIS_KEY_PATH!, 'utf8'),
  },
});
```

---

## Step 5 — Build and submit your first invoice

```typescript
const invoice = client.invoice()
  .id('INV-2024-001')
  .issueDate('2024-01-15')
  .issueTime('08:30:00Z')          // UTC time required
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
      countrySubentityCode: '14',  // see docs/codes-reference.md for full list
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
      countrySubentityCode: '10',
      countryCode: 'MYS',
    },
  })
  .addLine({
    id: '1',
    description: 'Software Development Services',
    quantity: 1,
    unitCode: 'HUR',               // Hour
    unitPrice: 5000.00,
    subtotal: 5000.00,
    taxCategory: {
      taxType: '02',               // Service Tax
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
  .build();                        // throws ValidationError if invalid

const result = await client.submit(invoice);
console.log('Submission UID:', result.submissionUid);
console.log('Accepted docs:', result.acceptedDocuments);
console.log('Rejected docs:', result.rejectedDocuments);
```

---

## Step 6 — Poll for the validation result

MyInvois processes submissions asynchronously. Poll until the status is no longer `in progress`:

```typescript
async function waitForResult(client, submissionUid) {
  let status = await client.getSubmission(submissionUid);

  while (status.overallStatus === 'in progress') {
    await new Promise(r => setTimeout(r, 3000));  // wait 3 seconds
    status = await client.getSubmission(submissionUid);
  }

  console.log('Final status:', status.overallStatus);  // 'valid' | 'invalid' | 'partially valid'
  for (const doc of status.documentSummary) {
    console.log(doc.internalId, doc.uuid, doc.status);
  }
  return status;
}
```

---

## What's next

- [Building Documents](building-documents.md) — all document types and fields
- [Submission](submission.md) — batching, cancelling, rejecting
- [Error Handling](error-handling.md) — what errors to expect and how to handle them
- [Codes Reference](codes-reference.md) — state codes, tax types, MSIC codes
