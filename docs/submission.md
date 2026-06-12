# Submission

---

## Submit a single document

```typescript
const result = await client.submit(invoice);

console.log(result.submissionUid);            // use this to poll status
console.log(result.acceptedDocuments);        // [{ uuid, invoiceCodeNumber }]
console.log(result.rejectedDocuments);        // [{ invoiceCodeNumber, error }]
```

`submit()` accepts either a single document or an array of up to 100. LHDN processes submissions asynchronously — HTTP 202 means "received", not "valid".

---

## Submit a batch (more than 100 documents)

```typescript
// submitBatch() automatically chunks into groups of 100
const results = await client.submitBatch(invoices);   // returns SubmissionResult[]

for (const r of results) {
  console.log(r.submissionUid, r.acceptedDocuments.length, r.rejectedDocuments.length);
}
```

---

## Poll for validation result

```typescript
const status = await client.getSubmission(submissionUid);
// status.overallStatus: 'in progress' | 'valid' | 'partially valid' | 'invalid'
```

Poll every few seconds until `overallStatus !== 'in progress'`:

```typescript
async function waitForValidation(client, submissionUid, intervalMs = 3000) {
  let status = await client.getSubmission(submissionUid);
  while (status.overallStatus === 'in progress') {
    await new Promise(r => setTimeout(r, intervalMs));
    status = await client.getSubmission(submissionUid);
  }
  return status;
}

const status = await waitForValidation(client, result.submissionUid);
console.log(status.overallStatus);            // 'valid' | 'partially valid' | 'invalid'

for (const doc of status.documentSummary) {
  console.log(doc.uuid, doc.status, doc.longId);
}
```

---

## Get a document

```typescript
// Raw document source (base64-encoded original JSON/XML)
const raw = await client.getDocument(uuid);
console.log(raw.document);            // base64 string

// Full details with validation results
const details = await client.getDocumentDetails(uuid);
console.log(details.status);
console.log(details.validationResults);
```

---

## Cancel a document

Cancellation is only possible within **72 hours** of submission and while the document is in `valid` status:

```typescript
await client.cancelDocument(uuid, 'Incorrect amount entered');
```

---

## Reject a document (buyer)

The buyer side can reject a received document within **72 hours**:

```typescript
await client.rejectDocument(uuid, 'Goods not received');
```

---

## Search and list documents

```typescript
// Last 31 days, sent by you
const recent = await client.getRecentDocuments({
  direction: 'sent',
  status: 'valid',
  pageNo: 1,
  pageSize: 20,
});
console.log(recent.result);           // DocumentListItem[]
console.log(recent.metadata.totalCount);

// Broader search
const found = await client.searchDocuments({
  direction: 'sent',
  issueDateFrom: '2024-01-01',
  issueDateTo: '2024-01-31',
  status: 'Valid',
});
```

---

## Submission rules (enforced by LHDN)

| Rule | Detail |
|---|---|
| Max documents per batch | 100 |
| Max submission size | 5 MB total |
| Max single document size | 300 KB |
| Duplicate detection | Same payload hash within 10 minutes → 429 error |
| Rate limit | 100 RPM per Client ID for submissions |
| Documents must be minified | Whitespace stripped before base64 encoding |
| Currency exchange rate | Required for non-MYR invoices from 1 Sep 2025 |

The SDK enforces the minification and exchange-rate rules automatically.

---

## Intermediary submissions

If using intermediary mode (acting on behalf of a taxpayer), configure the client with the `intermediary` option — see [Authentication](authentication.md). The submission API is identical.
