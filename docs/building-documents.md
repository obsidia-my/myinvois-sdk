# Building Documents

The SDK provides a fluent builder for each document type. All builders share the same base API.

---

## Document types

| Builder | Type Code | Description |
|---|---|---|
| `client.invoice()` | `01` | Standard invoice |
| `client.creditNote()` | `02` | Credit note (requires billingReference) |
| `client.debitNote()` | `03` | Debit note (requires billingReference) |
| `client.refundNote()` | `04` | Refund note (requires billingReference) |
| `client.selfBilledInvoice()` | `11` | Self-billed invoice |

---

## Builder methods

All builders share these methods:

```typescript
builder
  .id(string)                           // document number, e.g. 'INV-2024-001'
  .issueDate(string)                    // YYYY-MM-DD
  .issueTime(string)                    // HH:MM:SSZ (UTC) — defaults to '00:00:00Z'
  .currency(code, exchangeRate?)        // ISO 4217 code; exchangeRate required if not MYR
  .supplier(Party)
  .buyer(Party)
  .addLine(InvoiceLine)                 // call multiple times for multiple lines
  .taxTotal(TaxTotal)                   // optional: derived from lines if not provided
  .totals(MonetaryTotal)
  .billingReference(BillingReference)  // required for credit/debit/refund notes
  .paymentMeans(PaymentMeans)          // optional
  .paymentTerms(string)                // optional, free text
  .note(string)                        // optional, free text
  .additionalDocumentReference(refs[]) // optional
  .validate()                          // returns ValidationResult without throwing
  .build()                             // returns typed document or throws ValidationError
```

---

## Party (supplier / buyer)

```typescript
{
  tin: string,                         // Tax Identification Number
  identificationNumber: string,        // BRN / NRIC / Passport / Army number
  identificationType: 'BRN' | 'NRIC' | 'PASSPORT' | 'ARMY',
  name: string,
  address: {
    addressLines: string[],            // 1–3 lines
    cityName: string,
    postalZone: string,                // 5-digit postcode e.g. '50000'
    countrySubentityCode: string,      // Malaysian state code — see codes-reference.md
    countryCode: string,               // ISO 3166-1 alpha-3 e.g. 'MYS'
  },
  contact?: {
    telephone?: string,
    email?: string,
  },
  sst?: string,                        // SST registration number if applicable
  ttx?: string,                        // Tourism tax registration number if applicable
  msicCode?: string,                   // 5-digit MSIC code
  businessActivityDescription?: string,
}
```

---

## Invoice line

```typescript
{
  id: string,                          // line number, e.g. '1'
  description: string,
  quantity: number,
  unitCode: string,                    // UOM code — see codes-reference.md
  unitPrice: number,
  subtotal: number,                    // must equal quantity * unitPrice (±0.01)
  taxCategory: {
    taxType: string,                   // e.g. '01' SST, '02' Service Tax, 'E' Exempt
    taxRate: number,                   // percentage e.g. 8 for 8%
    taxableAmount: number,
    taxAmount: number,
    exemptionReason?: string,          // required when taxType = 'E'
  },
  classificationCode?: string,         // e-Invoice classification code
  originCountry?: string,              // ISO 3166-1 alpha-3
  discountAmount?: number,
  discountReason?: string,
}
```

---

## Tax total

If you don't call `.taxTotal()`, the SDK derives it automatically from your invoice lines:

```typescript
{
  taxAmount: number,                   // total tax
  taxSubtotals: [
    {
      taxableAmount: number,
      taxAmount: number,
      taxCategory: { taxType, taxRate },
    }
  ],
}
```

---

## Monetary totals

```typescript
{
  lineExtensionAmount: number,         // sum of all line subtotals
  taxExclusiveAmount: number,          // pre-tax total (usually = lineExtensionAmount)
  taxInclusiveAmount: number,          // total including tax
  allowanceTotalAmount?: number,       // total discounts
  chargeTotalAmount?: number,          // total surcharges
  payableAmount: number,               // final amount payable
}
```

---

## Credit / Debit / Refund notes

These require a `billingReference` pointing to the original invoice UUID in MyInvois:

```typescript
const creditNote = client.creditNote()
  .id('CN-2024-001')
  .issueDate('2024-02-01')
  .currency('MYR')
  .billingReference({
    invoiceDocumentReferenceId: 'INV-2024-001',
    uuid: 'f7ca7e17-b1ab-4f2a-a8d0-...',   // UUID from the original accepted submission
  })
  .supplier({ ... })
  .buyer({ ... })
  .addLine({ ... })
  .totals({ ... })
  .build();
```

---

## Foreign currency invoices

If billing in a currency other than MYR, you **must** provide an exchange rate (required from 1 September 2025):

```typescript
client.invoice()
  .currency('USD', 4.72)    // USD/MYR exchange rate
  // ...
```

The SDK will throw `ValidationError` if you omit the exchange rate for non-MYR currencies.

---

## Validation

Call `.validate()` to get errors without throwing, or `.build()` to throw on errors:

```typescript
// Non-throwing — inspect errors manually
const result = builder.validate();
if (!result.isValid) {
  for (const err of result.errors) {
    console.error(err.path, err.message);
  }
}

// Throwing — use in production flows
try {
  const doc = builder.build();
} catch (e) {
  if (e instanceof ValidationError) {
    console.error(e.fields);  // [{ field, message }]
  }
}
```

### What the validator checks

- All required fields present (id, issueDate, issueTime, currency, supplier, buyer, lines, totals)
- Date format is `YYYY-MM-DD`
- Time format is `HH:MM:SSZ` (UTC)
- State code is not `00` (deprecated)
- State code is a valid Malaysian state code
- Postcode is 5 digits
- MSIC code is 5 digits (when provided)
- Exchange rate present when currency is not MYR
- Line subtotal equals `quantity × unitPrice` (±0.01 tolerance)
- `lineExtensionAmount` equals sum of line subtotals (±0.01 tolerance)
- `exemptionReason` present when `taxType = 'E'`
- Address has 1–3 lines
