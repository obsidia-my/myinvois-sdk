# myinvois-sdk — Claude Code Master Prompt
# Obsidia Systems Sdn Bhd
# Version: 1.0.0
# Built against: MyInvois SDK v1.0 (LHDN), last updated August 2025

---

## PROJECT IDENTITY

You are the lead engineer for **myinvois-sdk**, an open source TypeScript SDK
for integrating with Malaysia's MyInvois e-Invoice system (LHDN / Lembaga Hasil
Dalam Negeri Malaysia), maintained by **Obsidia Systems Sdn Bhd**.

**Package name:** `@obsidia-my/myinvois-sdk`
**GitHub:** `github.com/obsidia-my/myinvois-sdk`
**Licence:** MIT
**Language:** TypeScript (strict mode)
**Runtime:** Node.js 18+
**Dependencies:** Minimal — only `node-forge` or Node's built-in `crypto` for
digital signing. No HTTP framework dependencies — use native `fetch` (Node 18+).

**SDK reference:** https://sdk.myinvois.hasil.gov.my
**Sandbox base URL:** `https://preprod.myinvois.hasil.gov.my`
**Production base URL:** `https://myinvois.hasil.gov.my`

---

## PROJECT PURPOSE

Every Malaysian business with annual revenue above RM150,000 is being phased
into mandatory e-invoice compliance under LHDN's MyInvois mandate by 2027.
Developers building ERP systems, accounting software, billing platforms, and
business management tools all need to integrate with MyInvois.

The official MyInvois SDK documentation is detailed but the developer experience
of implementing it is painful — UBL XML generation, XAdES digital signing,
OAuth token management, async submission polling, and error handling all need
to be pieced together from scratch.

**myinvois-sdk solves this.** It provides a complete, well-typed, well-tested
TypeScript SDK so Malaysian developers can integrate MyInvois in hours, not weeks.

**Design philosophy:**
- Developer experience first — the API should feel natural and obvious
- Strongly typed throughout — full TypeScript types for every request and response
- Handles the hard parts — UBL generation, XAdES signing, token refresh, retry logic
- Zero magic — every step is transparent and debuggable
- Well-tested — 100% coverage on core logic, integration tests against sandbox
- Complete documentation with real working examples

---

## REPOSITORY STRUCTURE

```
myinvois-sdk/
├── src/
│   ├── index.ts                        # Main barrel export
│   ├── client/
│   │   ├── index.ts
│   │   ├── MyInvoisClient.ts           # Main client class
│   │   ├── auth/
│   │   │   ├── TokenManager.ts         # OAuth token lifecycle management
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── http/
│   │       ├── HttpClient.ts           # Fetch wrapper with retry, rate limiting
│   │       ├── types.ts
│   │       └── index.ts
│   ├── documents/
│   │   ├── index.ts
│   │   ├── builder/
│   │   │   ├── InvoiceBuilder.ts       # Fluent builder for Invoice v1.1
│   │   │   ├── CreditNoteBuilder.ts
│   │   │   ├── DebitNoteBuilder.ts
│   │   │   ├── RefundNoteBuilder.ts
│   │   │   ├── SelfBilledInvoiceBuilder.ts
│   │   │   └── index.ts
│   │   ├── serialiser/
│   │   │   ├── XmlSerialiser.ts        # TypeScript object → UBL 2.1 XML
│   │   │   ├── JsonSerialiser.ts       # TypeScript object → UBL 2.1 JSON
│   │   │   └── index.ts
│   │   ├── signer/
│   │   │   ├── XadesSigner.ts          # XAdES digital signature (RSA-SHA256)
│   │   │   ├── CertificateLoader.ts    # X.509 cert loading and parsing
│   │   │   └── index.ts
│   │   ├── validator/
│   │   │   ├── DocumentValidator.ts    # Pre-submission validation
│   │   │   └── index.ts
│   │   └── types/
│   │       ├── invoice.ts              # Invoice v1.1 TypeScript types
│   │       ├── credit-note.ts
│   │       ├── debit-note.ts
│   │       ├── refund-note.ts
│   │       ├── self-billed.ts
│   │       ├── common.ts               # Shared document types
│   │       └── index.ts
│   ├── api/
│   │   ├── index.ts
│   │   ├── platform/
│   │   │   ├── LoginApi.ts             # Taxpayer + Intermediary login
│   │   │   ├── DocumentTypesApi.ts     # Get document types
│   │   │   ├── NotificationsApi.ts     # Get notifications
│   │   │   └── index.ts
│   │   └── einvoice/
│   │       ├── SubmitDocumentsApi.ts   # Submit 1–100 documents per batch
│   │       ├── CancelDocumentApi.ts
│   │       ├── RejectDocumentApi.ts
│   │       ├── GetDocumentApi.ts
│   │       ├── GetDocumentDetailsApi.ts
│   │       ├── GetSubmissionApi.ts
│   │       ├── GetRecentDocumentsApi.ts
│   │       ├── SearchDocumentsApi.ts
│   │       ├── ValidateTinApi.ts
│   │       ├── SearchTinApi.ts
│   │       ├── QrCodeApi.ts
│   │       └── index.ts
│   ├── codes/
│   │   ├── index.ts
│   │   ├── tax-types.ts               # SST, service tax, tourism tax codes
│   │   ├── classification-codes.ts    # e-Invoice classification codes
│   │   ├── country-codes.ts           # ISO country codes as used by MyInvois
│   │   ├── currency-codes.ts          # Currency codes supported
│   │   ├── state-codes.ts             # Malaysian state codes (no '00')
│   │   ├── unit-codes.ts              # UOM unit codes including GT
│   │   ├── payment-modes.ts           # Payment mode codes
│   │   └── msic-codes.ts              # MSIC business classification codes
│   ├── errors/
│   │   ├── index.ts
│   │   ├── MyInvoisError.ts           # Base error class
│   │   ├── ValidationError.ts
│   │   ├── AuthError.ts
│   │   ├── RateLimitError.ts          # 429 with Retry-After handling
│   │   └── ApiError.ts
│   └── utils/
│       ├── index.ts
│       ├── hash.ts                    # SHA256, base64 utilities
│       ├── date.ts                    # UTC date formatting for MyInvois
│       └── minify.ts                  # XML/JSON minification before submission
├── tests/
│   ├── unit/
│   │   ├── documents/
│   │   │   ├── builder.test.ts
│   │   │   ├── serialiser.test.ts
│   │   │   ├── signer.test.ts
│   │   │   └── validator.test.ts
│   │   ├── api/
│   │   │   ├── submit.test.ts
│   │   │   ├── cancel.test.ts
│   │   │   └── search.test.ts
│   │   └── utils/
│   │       ├── hash.test.ts
│   │       └── date.test.ts
│   ├── integration/
│   │   └── sandbox.test.ts            # Live sandbox tests (skipped in CI unless SANDBOX=true)
│   └── fixtures/
│       ├── sample-invoice.ts          # Valid sample invoice data
│       ├── sample-credit-note.ts
│       └── sample-certificate.ts      # Test certificate for signing tests
├── examples/
│   ├── 01-submit-invoice.ts
│   ├── 02-submit-batch.ts
│   ├── 03-cancel-document.ts
│   ├── 04-check-status.ts
│   └── 05-intermediary.ts
├── docs/
│   ├── getting-started.md
│   ├── authentication.md
│   ├── building-documents.md
│   ├── digital-signing.md
│   ├── submission.md
│   ├── error-handling.md
│   └── codes-reference.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── publish.yml
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.ts
├── .eslintrc.json
├── .prettierrc
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## MYINVOIS SYSTEM — TECHNICAL REFERENCE

This section documents the actual MyInvois API as of SDK v1.0 (August 2025).
Build against this exactly. Do not guess or infer — if something is unclear,
note it with a TODO comment and ask.

### Environments

| Environment | Auth URL | API Base URL |
|---|---|---|
| Sandbox | `https://preprod.myinvois.hasil.gov.my/connect/token` | `https://preprod.myinvois.hasil.gov.my/api/v1.0` |
| Production | `https://myinvois.hasil.gov.my/connect/token` | `https://myinvois.hasil.gov.my/api/v1.0` |

### Authentication — OAuth 2.0 Client Credentials

**Login as Taxpayer System**
`POST /connect/token`

```
Content-Type: application/x-www-form-urlencoded
Body: grant_type=client_credentials&client_id={TIN}_{clientId}&client_secret={secret}&scope=InvoicingAPI
```

**Login as Intermediary System** (acting on behalf of taxpayer)
`POST /connect/token`
```
Content-Type: application/x-www-form-urlencoded
Headers: onbehalfof: {taxpayer_TIN}
Body: grant_type=client_credentials&client_id={TIN}_{clientId}&client_secret={secret}&scope=InvoicingAPI
```

Token is valid for **3600 seconds (1 hour)**. TokenManager must handle
automatic refresh before expiry. Store token with expiry timestamp and
refresh proactively 5 minutes before expiry.

**Standard API Headers (all authenticated calls)**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Rate Limits (enforced from May 30, 2025)

- Submit Documents: 100 RPM per Client ID
- All other APIs: check integration practices page for current limits
- On 429 response: read `Retry-After` header, wait that many seconds, then retry
- Sandbox has lower rate limits than production

### Platform APIs

**GET `/api/v1.0/documenttypes`** — Get all document types
**GET `/api/v1.0/documenttypes/{id}`** — Get single document type
**GET `/api/v1.0/documenttypes/{id}/versions/{vid}`** — Get document type version
**GET `/api/v1.0/notifications/taxpayer`** — Get notifications

### e-Invoice APIs

**1. Validate Taxpayer TIN**
`GET /api/v1.0/taxpayer/validate/{tin}?idType={type}&idValue={value}`
- idType: NRIC, PASSPORT, BRN, ARMY
- Returns 200 if valid, 400 if not

**2. Submit Documents**
`POST /api/v1.0/documentsubmissions/`
- Content-Type: `application/json` (or `application/xml`)
- Max 100 documents per batch
- Max 5MB per submission
- Max 300KB per individual document
- Returns HTTP 202 (async processing)
- Body structure:
```json
{
  "documents": [
    {
      "format": "JSON",
      "document": "{base64_encoded_document}",
      "documentHash": "{SHA256_hash_of_document}",
      "codeNumber": "INV-2024-001"
    }
  ]
}
```
- Response includes `submissionUID`, `acceptedDocuments[]`, `rejectedDocuments[]`
- Documents must be minified before base64 encoding
- Currency exchange rate required if currency is not MYR (effective 1 Sep 2025)

**3. Cancel Document**
`PUT /api/v1.0/documents/state/{uuid}/state`
```json
{ "status": "cancelled", "reason": "..." }
```

**4. Reject Document**
`PUT /api/v1.0/documents/state/{uuid}/state`
```json
{ "status": "rejected", "reason": "..." }
```

**5. Get Recent Documents**
`GET /api/v1.0/documents/recent?pageNo={n}&pageSize={size}&submissionDateFrom={date}&submissionDateTo={date}&issueDateFrom={date}&issueDateTo={date}&direction={sent|received}&status={valid|invalid|cancelled|rejected}`
- Only returns documents issued within last 31 days

**6. Get Submission**
`GET /api/v1.0/documentsubmissions/{submissionUID}`

**7. Get Document**
`GET /api/v1.0/documents/{uuid}/raw`
- Returns source XML or JSON with LHDN metadata

**8. Get Document Details**
`GET /api/v1.0/documents/{uuid}/details`
- Returns full validation results

**9. Search Documents**
`GET /api/v1.0/documents?pageNo={n}&pageSize={size}&...`
- Supports various filter parameters

**10. Search Taxpayer TIN**
`GET /api/v1.0/taxpayer/search/tin?idType={type}&idValue={value}&taxpayerName={name}`

**11. QR Code**
`GET /api/v1.0/taxpayer/qrcode?qrCodeToken={base64token}`

### Document Types Supported

| Type | Code | Version |
|---|---|---|
| Invoice | 01 | v1.1 (use this — v1.0 deprecated) |
| Credit Note | 02 | v1.1 |
| Debit Note | 03 | v1.1 |
| Refund Note | 04 | v1.1 |
| Self-Billed Invoice | 11 | v1.1 |
| Self-Billed Credit Note | 12 | v1.1 |
| Self-Billed Debit Note | 13 | v1.1 |
| Self-Billed Refund Note | 14 | v1.1 |

### Digital Signature Requirements

**Algorithm:** XAdES (XML Advanced Electronic Signature)
**Hash:** SHA-256
**Signature algorithm:** RSA
**Canonicalization:** xml-c14n11 (`https://www.w3.org/TR/xml-c14n11/#`)
**Signature method:** rsa-sha256 (`http://www.w3.org/2001/04/xmldsig-more#rsa-sha256`)

**What gets signed:** The entire document EXCEPT:
- `UBLExtensions` element
- `Signature` element

XPath transforms to exclude:
```xpath
not(//ancestor-or-self::ext:UBLExtensions)
not(//ancestor-or-self::cac:Signature)
```

**Four computed values required:**

1. **CertDigest** — HEX-SHA256 of the signing certificate DER bytes, then base64
2. **DocDigest** — SHA256 of the canonicalised document content (after transforms), hex-to-base64
3. **PropsDigest** — SHA256 of the XAdES `QualifyingProperties` element, hex-to-base64
4. **Sig** — RSA signature of the SignedInfo element using private key, base64

**Certificate requirements (X.509):**
- Issued by a Malaysian CA (MCMC recognised)
- Key Usage: Non-Repudiation (40) must be present
- Extended Key Usage: Document Signing (1.3.6.1.4.1.311.10.3.12) must be present
- Distinguished Name must include: CN (company name), C=MY, O (company name),
  organizationIdentifier (TIN), serialNumber (BRN)

**Signature structure in UBL XML:**
```xml
<ext:UBLExtensions>
  <ext:UBLExtension>
    <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
    <ext:ExtensionContent>
      <sig:UBLDocumentSignatures>
        <sac:SignatureInformation>
          <ds:Signature Id="DocSig">
            <ds:SignedInfo>
              <ds:CanonicalizationMethod Algorithm="https://www.w3.org/TR/xml-c14n11/#"/>
              <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
              <ds:Reference Id="id-doc-signed-data" URI="">
                <ds:Transforms>
                  <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                    <ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath>
                  </ds:Transform>
                  <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                    <ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath>
                  </ds:Transform>
                  <ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
                </ds:Transforms>
                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                <ds:DigestValue>{DocDigest}</ds:DigestValue>
              </ds:Reference>
              <ds:Reference URI="#id-xades-signed-props">
                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                <ds:DigestValue>{PropsDigest}</ds:DigestValue>
              </ds:Reference>
            </ds:SignedInfo>
            <ds:SignatureValue ID="DocSigValue">{Sig}</ds:SignatureValue>
            <ds:KeyInfo>
              <ds:X509Data>
                <ds:X509Certificate>{base64_cert}</ds:X509Certificate>
              </ds:X509Data>
            </ds:KeyInfo>
            <ds:Object>
              <xades:QualifyingProperties Target="signature">
                <xades:SignedProperties Id="id-xades-signed-props">
                  <xades:SignedSignatureProperties>
                    <xades:SigningTime>{UTC_timestamp}</xades:SigningTime>
                    <xades:SigningCertificate>
                      <xades:Cert>
                        <xades:CertDigest>
                          <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                          <ds:DigestValue>{CertDigest}</ds:DigestValue>
                        </xades:CertDigest>
                        <xades:IssuerSerial>
                          <ds:X509IssuerName>{cert_CN}</ds:X509IssuerName>
                          <ds:X509SerialNumber>{cert_serial}</ds:X509SerialNumber>
                        </xades:IssuerSerial>
                      </xades:Cert>
                    </xades:SigningCertificate>
                  </xades:SignedSignatureProperties>
                </xades:SignedProperties>
              </xades:QualifyingProperties>
            </ds:Object>
          </ds:Signature>
        </sac:SignatureInformation>
      </sig:UBLDocumentSignatures>
    </ext:ExtensionContent>
  </ext:UBLExtension>
</ext:UBLExtensions>
```

### Standard Error Response Structure

```json
{
  "status": "InvalidEInvoice",
  "error": {
    "code": "BadStructure",
    "message": "...",
    "target": "...",
    "details": [
      {
        "code": "...",
        "message": "...",
        "target": "...",
        "propertyPath": "..."
      }
    ],
    "innerError": {}
  }
}
```

Common error codes:
- `BadStructure` — malformed submission
- `MaximumSizeExceeded` — over 5MB or 100 docs
- `IncorrectSubmitter` — wrong taxpayer/intermediary
- `DuplicateSubmission` — identical submission within 10 minutes (hash-based detection)

### Important Notes from LHDN (enforce these in the SDK)

- State code `00` is no longer valid — reject it in validation
- Currency exchange rate is **required** when currency != MYR (from 1 Sep 2025)
- Documents must be minified (whitespace removed) before base64 encoding
- Submit in batches of up to 100 — do not submit individually when batching is possible
- Do not re-submit without reviewing the previous submission result
- Submission is async — poll using Get Submission API
- Duplicate detection based on payload hash — same content within 10 minutes = 429

---

## TYPESCRIPT TYPES — CORE INTERFACES

### Client Configuration

```typescript
export interface MyInvoisClientConfig {
  environment: 'sandbox' | 'production';
  clientId: string;
  clientSecret: string;
  tin: string;                           // Taxpayer TIN
  // For intermediary mode
  intermediary?: {
    tin: string;
    onBehalfOfTin: string;
  };
  // Certificate for signing
  certificate: {
    cert: string;                        // PEM encoded certificate
    privateKey: string;                  // PEM encoded private key
  };
  // Optional
  timeout?: number;                      // Request timeout ms, default 30000
  retries?: number;                      // Max retries on transient errors, default 3
  debug?: boolean;                       // Log request/response details
}
```

### Invoice Document Types

```typescript
export interface InvoiceDocument {
  // Document metadata
  id: string;                            // Internal invoice number e.g. "INV-2024-001"
  issueDate: string;                     // YYYY-MM-DD
  issueTime: string;                     // HH:MM:SSZ (UTC)
  currencyCode: string;                  // ISO 4217 e.g. "MYR"
  exchangeRate?: number;                 // Required if currencyCode != "MYR"

  // Supplier (issuer)
  supplier: Party;

  // Buyer
  buyer: Party;

  // Invoice lines
  lines: InvoiceLine[];

  // Tax totals
  taxTotal: TaxTotal;

  // Monetary totals
  legalMonetaryTotal: MonetaryTotal;

  // Optional
  invoiceTypeCode?: string;              // Default "01" for standard invoice
  documentCurrencyCode?: string;
  taxCurrencyCode?: string;
  billingReference?: BillingReference;  // For credit/debit notes referencing original
  additionalDocumentReference?: AdditionalDocumentReference[];
  paymentMeans?: PaymentMeans;
  paymentTerms?: string;
  note?: string;
}

export interface Party {
  tin: string;                           // Tax Identification Number
  identificationNumber: string;         // BRN / NRIC / Passport
  identificationType: 'BRN' | 'NRIC' | 'PASSPORT' | 'ARMY';
  name: string;
  address: Address;
  contact?: Contact;
  sst?: string;                          // SST registration number
  ttx?: string;                          // Tourism Tax registration number
  msicCode?: string;                     // MSIC business classification code
  businessActivityDescription?: string;
}

export interface Address {
  addressLines: string[];                // Min 1, max 3 lines
  cityName: string;
  postalZone: string;                    // 5-digit postcode
  countrySubentityCode: string;          // Malaysian state code (not '00')
  countryCode: string;                   // ISO 3166-1 alpha-2 e.g. "MYR"
}

export interface Contact {
  telephone?: string;
  email?: string;
}

export interface InvoiceLine {
  id: string;                            // Line number e.g. "1"
  description: string;
  quantity: number;
  unitCode: string;                      // UOM code
  unitPrice: number;
  subtotal: number;                      // quantity * unitPrice
  taxCategory: TaxCategory;
  classificationCode?: string;           // e-Invoice classification code
  itemCommodityClassification?: string;  // MSIC code
  originCountry?: string;
  discountAmount?: number;
  discountReason?: string;
}

export interface TaxCategory {
  taxType: string;                       // "01" SST, "02" Service Tax, "E" Exempt etc
  taxRate: number;                       // Percentage e.g. 8 for 8%
  taxableAmount: number;
  taxAmount: number;
  exemptionReason?: string;              // Required when taxType = "E"
}

export interface TaxTotal {
  taxAmount: number;
  taxSubtotals: TaxSubtotal[];
}

export interface TaxSubtotal {
  taxableAmount: number;
  taxAmount: number;
  taxCategory: Pick<TaxCategory, 'taxType' | 'taxRate'>;
}

export interface MonetaryTotal {
  lineExtensionAmount: number;           // Sum of line subtotals
  taxExclusiveAmount: number;            // Pre-tax total
  taxInclusiveAmount: number;            // Total including tax
  allowanceTotalAmount?: number;         // Total discounts
  chargeTotalAmount?: number;            // Total surcharges
  payableAmount: number;                 // Final payable amount
}

export interface BillingReference {
  invoiceDocumentReferenceId: string;   // UUID of original invoice in MyInvois
  uuid: string;
}

export interface PaymentMeans {
  paymentMeansCode: string;             // Payment mode code
  paymentDueDate?: string;              // YYYY-MM-DD
  payeeFinancialAccountId?: string;     // Bank account number
  paymentId?: string;                   // Reference number
}

// Submission result types
export interface SubmissionResult {
  submissionUID: string;
  acceptedDocuments: AcceptedDocument[];
  rejectedDocuments: RejectedDocument[];
}

export interface AcceptedDocument {
  uuid: string;
  invoiceCodeNumber: string;
}

export interface RejectedDocument {
  invoiceCodeNumber: string;
  error: MyInvoisApiError;
}

export interface MyInvoisApiError {
  code: string;
  message: string;
  target?: string;
  details?: ErrorDetail[];
}

export interface ErrorDetail {
  code: string;
  message: string;
  target?: string;
  propertyPath?: string;
}
```

---

## MAIN CLIENT API — DEVELOPER-FACING INTERFACE

This is what developers using the SDK will actually write. Design this to be
clean and intuitive first, then implement underneath.

```typescript
import { MyInvoisClient } from '@obsidia-my/myinvois-sdk';

// Initialise
const client = new MyInvoisClient({
  environment: 'sandbox',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tin: 'C20830570210',
  certificate: {
    cert: fs.readFileSync('cert.pem', 'utf8'),
    privateKey: fs.readFileSync('key.pem', 'utf8'),
  }
});

// Build and submit an invoice
const invoice = client.invoice()
  .id('INV-2024-001')
  .issueDate('2024-01-15')
  .currency('MYR')
  .supplier({ tin: 'C20830570210', name: 'Obsidia Systems Sdn Bhd', ... })
  .buyer({ tin: 'C12345678901', name: 'Client Company Sdn Bhd', ... })
  .addLine({ description: 'Software Development Services', quantity: 1, unitPrice: 5000, ... })
  .addLine({ description: 'Hosting Services', quantity: 1, unitPrice: 500, ... })
  .build();

// Sign and submit
const result = await client.submit(invoice);
console.log(result.submissionUID);
console.log(result.acceptedDocuments[0].uuid);

// Poll for status
const submission = await client.getSubmission(result.submissionUID);

// Get document details
const details = await client.getDocumentDetails(result.acceptedDocuments[0].uuid);

// Cancel
await client.cancelDocument(uuid, 'Incorrect amount');

// Search
const docs = await client.searchDocuments({ direction: 'sent', status: 'valid' });
```

### MyInvoisClient Class — Public Methods

```typescript
class MyInvoisClient {
  constructor(config: MyInvoisClientConfig)

  // Document builders
  invoice(): InvoiceBuilder
  creditNote(): CreditNoteBuilder
  debitNote(): DebitNoteBuilder
  refundNote(): RefundNoteBuilder
  selfBilledInvoice(): SelfBilledInvoiceBuilder

  // Submission
  submit(document: InvoiceDocument | InvoiceDocument[]): Promise<SubmissionResult>
  submitBatch(documents: InvoiceDocument[]): Promise<SubmissionResult>  // auto-batches into 100-doc chunks

  // Document lifecycle
  cancelDocument(uuid: string, reason: string): Promise<void>
  rejectDocument(uuid: string, reason: string): Promise<void>

  // Retrieval
  getSubmission(submissionUID: string): Promise<SubmissionStatus>
  getDocument(uuid: string): Promise<DocumentSource>
  getDocumentDetails(uuid: string): Promise<DocumentDetails>
  getRecentDocuments(params?: GetRecentDocumentsParams): Promise<DocumentList>
  searchDocuments(params: SearchDocumentsParams): Promise<DocumentList>

  // Taxpayer utilities
  validateTin(tin: string, idType: IdType, idValue: string): Promise<boolean>
  searchTin(params: SearchTinParams): Promise<TaxpayerInfo[]>
  getQrCodeInfo(qrCodeToken: string): Promise<TaxpayerInfo>

  // Platform
  getDocumentTypes(): Promise<DocumentType[]>
  getNotifications(params?: GetNotificationsParams): Promise<Notification[]>

  // Low-level — for advanced use
  sign(document: InvoiceDocument): Promise<SignedDocument>
  serialise(document: SignedDocument, format: 'json' | 'xml'): string
  validate(document: InvoiceDocument): ValidationResult
}
```

---

## IMPLEMENTATION DETAILS — KEY MODULES

### TokenManager

```typescript
class TokenManager {
  private token: string | null = null;
  private expiresAt: number = 0;
  private readonly REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 min before expiry

  async getValidToken(): Promise<string>
  // Fetches new token if null or expiring within buffer
  // Stores token and expiresAt = Date.now() + (expires_in * 1000)
  // Thread-safe: if refresh is in progress, queue and await single refresh

  private async fetchToken(): Promise<void>
  // POST to /connect/token with client_credentials grant
  // Set onbehalfof header for intermediary mode
}
```

### HttpClient

```typescript
class HttpClient {
  // Wraps fetch with:
  // - Automatic Authorization header injection via TokenManager
  // - Retry logic: 3 retries on 5xx and network errors with exponential backoff
  // - Rate limit handling: on 429, read Retry-After header, wait, then retry
  // - Request timeout (configurable, default 30s)
  // - Debug logging (when config.debug = true)
  // - Standard error parsing into typed MyInvoisError objects

  async get<T>(path: string, params?: Record<string, string>): Promise<T>
  async post<T>(path: string, body: unknown): Promise<T>
  async put<T>(path: string, body: unknown): Promise<T>
}
```

### XadesSigner

```typescript
class XadesSigner {
  constructor(cert: string, privateKey: string)
  // cert and privateKey are PEM strings

  async sign(document: string, format: 'xml' | 'json'): Promise<string>
  // Returns signed document string

  private computeCertDigest(): string
  // SHA256 of cert DER bytes → hex → base64

  private computeDocDigest(canonicalisedDoc: string): string
  // SHA256 of canonicalised document content → hex → base64

  private computePropsDigest(qualifyingProperties: string): string
  // SHA256 of XAdES QualifyingProperties XML → hex → base64

  private computeSignature(signedInfoXml: string): string
  // RSA-SHA256 sign of SignedInfo → base64

  private canonicalise(xml: string): string
  // Apply xml-c14n11 canonicalisation

  private applyTransforms(xml: string): string
  // Remove UBLExtensions and Signature elements before hashing
}
```

### DocumentValidator

Pre-submission validation — catch errors before hitting the API.

```typescript
class DocumentValidator {
  validate(document: InvoiceDocument): ValidationResult
  // Checks:
  // - All required fields present
  // - State code is not '00'
  // - Currency exchange rate present when currency != MYR
  // - Date formats are correct (YYYY-MM-DD)
  // - Time is UTC format
  // - TIN format is valid
  // - Line amounts add up correctly
  // - Tax amounts are consistent
  // - Postcode is 5 digits
  // - MSIC code format is valid
  // Returns { isValid: boolean, errors: ValidationError[], warnings: ValidationWarning[] }
}
```

### Minifier

Before base64 encoding for submission:

```typescript
// XML: remove all whitespace between tags, remove comments
function minifyXml(xml: string): string

// JSON: JSON.stringify with no spaces
function minifyJson(obj: unknown): string
```

---

## STATIC CODE REFERENCE DATA

Bundle all LHDN reference codes as static TypeScript constants.
These must be accurate — source from sdk.myinvois.hasil.gov.my/codes/

### Key code sets to implement

**State codes** (no '00' — it is deprecated):
```typescript
export const STATE_CODES = {
  '01': 'Johor',
  '02': 'Kedah',
  '03': 'Kelantan',
  '04': 'Melaka',
  '05': 'Negeri Sembilan',
  '06': 'Pahang',
  '07': 'Pulau Pinang',
  '08': 'Perak',
  '09': 'Perlis',
  '10': 'Selangor',
  '11': 'Terengganu',
  '12': 'Sabah',
  '13': 'Sarawak',
  '14': 'Wilayah Persekutuan Kuala Lumpur',
  '15': 'Wilayah Persekutuan Labuan',
  '16': 'Wilayah Persekutuan Putrajaya',
  '17': 'Tidak Berkenaan', // Not applicable
} as const;
```

**Tax types:**
```typescript
export const TAX_TYPES = {
  '01': 'Sales Tax',
  '02': 'Service Tax',
  '03': 'Tourism Tax',
  '04': 'High-Value Goods Tax',
  '05': 'Sales Tax on Low Value Goods',
  '06': 'Not Applicable',
  'E':  'Tax Exemption',
} as const;
```

**Payment modes:**
```typescript
export const PAYMENT_MODES = {
  '01': 'Cash',
  '02': 'Cheque',
  '03': 'Bank Transfer',
  '04': 'Credit Card',
  '05': 'Debit Card',
  '06': 'e-Wallet / Digital Wallet',
  '07': 'Digital Bank',
  '08': 'Others',
} as const;
```

**Document classification codes**, **MSIC codes**, **unit codes**, **country codes**,
and **currency codes** — fetch from `https://sdk.myinvois.hasil.gov.my/codes/`
and include as complete static constants. Do not truncate.

---

## ERROR HANDLING DESIGN

Never throw raw JavaScript Error objects. All errors extend `MyInvoisError`:

```typescript
class MyInvoisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: ErrorDetail[]
  ) {
    super(message);
    this.name = 'MyInvoisError';
  }
}

class ValidationError extends MyInvoisError {
  constructor(message: string, public readonly fields: ValidationFailure[]) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

class AuthError extends MyInvoisError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

class RateLimitError extends MyInvoisError {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

class ApiError extends MyInvoisError {
  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: ErrorDetail[]
  ) {
    super(message, code, statusCode, details);
    this.name = 'ApiError';
  }
}
```

---

## TESTING REQUIREMENTS

### Unit Tests — 100% coverage on all core logic

**Document Builder tests:**
- Build valid invoice with all required fields
- Build invoice with optional fields
- Fluent builder — chain all methods
- Validation catches missing supplier TIN
- Validation catches missing buyer
- Validation catches empty invoice lines
- Validation catches state code '00'
- Validation catches missing exchange rate when currency != MYR
- Validation catches incorrect line amount arithmetic

**Serialiser tests:**
- XML output matches UBL 2.1 schema structure
- JSON output matches UBL 2.1 JSON alternative structure
- Namespaces are correct
- Element order follows UBL 2.1 sequence requirements
- Special characters escaped correctly in XML

**Signer tests:**
- CertDigest computed correctly (compare against known value)
- DocDigest computed correctly (compare against known value)
- XAdES structure is valid
- Signed document passes LHDN's validation rules
- Test using LHDN's sample signed XML as reference fixture

**API tests (mocked fetch):**
- Login — successful token acquisition
- Login — handles 401 correctly
- Submit — single document
- Submit — batch of 100
- Submit — batch auto-splits when > 100 documents
- Submit — 429 triggers retry after Retry-After seconds
- Submit — duplicate returns DuplicateSubmission error
- Cancel — success
- Cancel — document not found
- Get submission — returns status
- Search — with all filter params

**TokenManager tests:**
- Returns cached token when valid
- Refreshes token 5 min before expiry
- Handles concurrent calls during refresh (only one refresh fires)
- Clears token on 401 and re-authenticates

### Integration Tests (sandbox)
Run only when `MYINVOIS_SANDBOX=true` env var is set:
- Full flow: authenticate → build invoice → sign → submit → poll → get details
- Submit batch of 10 invoices
- Cancel a submitted invoice
- Search for documents

---

## PACKAGE.JSON

```json
{
  "name": "@obsidia-my/myinvois-sdk",
  "version": "0.1.0",
  "description": "TypeScript SDK for Malaysia's MyInvois e-Invoice system (LHDN). UBL 2.1 generation, XAdES signing, and full API coverage.",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "test": "jest --coverage --testPathIgnorePatterns=integration",
    "test:integration": "MYINVOIS_SANDBOX=true jest tests/integration",
    "test:all": "jest --coverage",
    "lint": "eslint src tests --ext .ts",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run typecheck && npm run lint && npm run test && npm run build"
  },
  "keywords": [
    "malaysia", "myinvois", "einvoice", "e-invoice", "lhdn",
    "ubl", "xades", "digital-signature", "tax", "invoice", "sdk"
  ],
  "author": "Obsidia Systems Sdn Bhd <hello@obsidia.my>",
  "license": "MIT",
  "dependencies": {
    "node-forge": "^1.3.1"
  },
  "devDependencies": {}
}
```

Note: `node-forge` is the one allowed runtime dependency — used for X.509
certificate parsing and RSA signing. If Node 18+ built-in `crypto` can handle
all required operations without `node-forge`, prefer that and keep runtime
dependencies at zero. Evaluate during implementation.

---

## IMPLEMENTATION ORDER

Complete each step fully with passing tests before moving to next.

```
Step 1 — Scaffold
  - package.json, tsconfig, jest config, eslint, prettier
  - Error classes (errors/)
  - Utility functions: hash.ts, date.ts, minify.ts
  - GitHub Actions CI/CD
  - Confirm: typecheck passes, 0 tests pass

Step 2 — Static codes
  - All code reference data in codes/
  - state-codes.ts, tax-types.ts, payment-modes.ts, currency-codes.ts
  - country-codes.ts, unit-codes.ts, classification-codes.ts, msic-codes.ts
  - Confirm: typecheck passes, code constants exported correctly

Step 3 — Document types and builder
  - types/common.ts, types/invoice.ts, types/credit-note.ts, etc.
  - builder/InvoiceBuilder.ts (fluent builder pattern)
  - Other builders following same pattern
  - validator/DocumentValidator.ts
  - Confirm: all builder tests pass, 100% coverage

Step 4 — Serialisation
  - serialiser/XmlSerialiser.ts — UBL 2.1 XML output
  - serialiser/JsonSerialiser.ts — UBL 2.1 JSON output
  - Confirm: serialiser tests pass, output matches UBL 2.1 structure

Step 5 — Digital signing
  - signer/CertificateLoader.ts
  - signer/XadesSigner.ts
  - Confirm: signed output matches LHDN's sample signed XML structure
  - This is the hardest step — take time to get it right

Step 6 — HTTP client and auth
  - client/http/HttpClient.ts
  - client/auth/TokenManager.ts
  - Confirm: TokenManager tests pass including concurrent refresh

Step 7 — API wrappers
  - api/platform/ — all platform APIs
  - api/einvoice/ — all e-invoice APIs
  - Confirm: all API tests pass with mocked fetch

Step 8 — Main client
  - client/MyInvoisClient.ts — assembles everything
  - src/index.ts — barrel exports
  - Confirm: full client API works end to end in unit tests

Step 9 — Examples and documentation
  - examples/ — 5 working examples
  - docs/ — all documentation files
  - README.md — full with badges, quick start, API reference

Step 10 — Build and publish prep
  - npm run build — confirm CJS + ESM + .d.ts output
  - npm run prepublishOnly — must pass completely
```

---

## README QUICK START (include this exactly)

```typescript
import { MyInvoisClient } from '@obsidia-my/myinvois-sdk';
import fs from 'fs';

const client = new MyInvoisClient({
  environment: 'sandbox',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tin: 'C20830570210',
  certificate: {
    cert: fs.readFileSync('cert.pem', 'utf8'),
    privateKey: fs.readFileSync('key.pem', 'utf8'),
  }
});

// Build an invoice
const invoice = client.invoice()
  .id('INV-2024-001')
  .issueDate('2024-01-15')
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
      countrySubentityCode: '14',
      countryCode: 'MYS',
    }
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
    }
  })
  .addLine({
    id: '1',
    description: 'Software Development Services',
    quantity: 1,
    unitCode: 'HUR',
    unitPrice: 5000.00,
    subtotal: 5000.00,
    taxCategory: {
      taxType: '02',
      taxRate: 8,
      taxableAmount: 5000.00,
      taxAmount: 400.00,
    }
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
console.log('Submission UID:', result.submissionUID);
console.log('Document UUID:', result.acceptedDocuments[0]?.uuid);

// Poll for validation result
const status = await client.getSubmission(result.submissionUID);
console.log('Status:', status.overallStatus);
```

---

## BEHAVIOUR GUIDELINES FOR CLAUDE CODE

**Always run tests after any change.** After any source file edit, run
`npm run test` before declaring done. Fix all failures before moving on.

**Always run typecheck after any change.** Zero TypeScript errors at all times.
No `any`, no `@ts-ignore`, no non-null assertions `!`.

**The XAdES signing step is the hardest part.** Do not rush it. Use LHDN's
sample signed XML (`https://sdk.myinvois.hasil.gov.my/files/one-doc-signed.xml`)
as the reference fixture. Verify your signer produces output that matches the
structure of that sample.

**Never invent LHDN codes.** If a code value is needed and not documented here,
fetch it from `sdk.myinvois.hasil.gov.my/codes/` rather than guessing.

**Minification is mandatory.** All documents must be minified before base64
encoding for submission. Failing to minify causes validation errors.

**Currency exchange rate is required from Sep 1, 2025.** The validator must
enforce this — reject documents with non-MYR currency that are missing an
exchange rate.

**State code '00' is invalid.** Reject it in the validator with a clear error.

**Commit message format:**
```
feat(builder): add fluent InvoiceBuilder with full type safety
feat(signer): implement XAdES RSA-SHA256 document signing
feat(client): add TokenManager with proactive refresh
feat(api): add all e-invoice API wrappers
fix(signer): correct canonicalisation transform order
fix(validator): reject state code 00 with clear error message
docs: add complete README with quick start and API reference
```

**When completing each step**, output:
- What was built
- Test coverage percentage
- Any deviations from this spec and why
- Next step

---

## FINAL GOAL

When this project is complete, a Malaysian developer building an ERP, accounting
system, or billing platform should be able to add one package and have a
production-ready MyInvois integration in a single afternoon — with full
TypeScript types, correct UBL 2.1 structure, proper XAdES signing, automatic
token management, batch submission, and clear error messages.

This is Obsidia's contribution to making Malaysia's e-invoice mandate less
painful for every developer in the country.

It must be excellent.
