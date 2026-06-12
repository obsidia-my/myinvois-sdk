# Digital Signing

Every MyInvois document must be digitally signed before submission. The SDK handles this automatically when you call `client.submit()`.

---

## How signing works (high level)

When you call `client.submit(invoice)`:

1. The invoice is serialised to UBL 2.1 JSON format (minified)
2. The SDK computes 4 values required by XAdES:
   - **CertDigest** — SHA-256 of your certificate's DER-encoded bytes → hex → base64
   - **DocDigest** — SHA-256 of the minified document content → base64
   - **PropsDigest** — SHA-256 of the XAdES `SignedProperties` XML element → base64
   - **SignatureValue** — RSA-SHA256 signature over the `SignedInfo` element → base64
3. The signature block (`ds:Signature`) is embedded into the document's `UBLExtensions`
4. The signed, minified document is base64-encoded and included in the submission payload

---

## XAdES specification used

| Parameter | Value |
|---|---|
| Signature algorithm | RSA-SHA256 |
| Canonicalisation | Exclusive C14N (`http://www.w3.org/2001/10/xml-exc-c14n#`) |
| Digest algorithm | SHA-256 |
| XAdES profile | XAdES-BES (SignedProperties only) |
| Document transforms | Strip `UBLExtensions`, strip `cac:Signature` before hashing |

---

## Certificate requirements

Your certificate must be issued by a **MCMC-recognised Malaysian CA** and have:

| Field | Required value |
|---|---|
| Key Usage | Non-Repudiation (bit 1) |
| Extended Key Usage | Document Signing — `1.3.6.1.4.1.311.10.3.12` |
| Subject DN — CN | Company name |
| Subject DN — C | `MY` |
| Subject DN — O | Company name |
| Subject DN — organizationIdentifier | Your TIN |
| Subject DN — serialNumber | Your BRN |

Recognised CAs:
- Pos Digicert (`posdigicert.com.my`)
- MSC Trustgate (`trustgate.com.my`)
- Telekom Applied Business (`tab.com.my`)

---

## Loading your certificate

Certificates must be in PEM format. If you have a `.p12` / `.pfx` file from your CA:

```bash
# Extract certificate
openssl pkcs12 -in mycert.p12 -nokeys -out cert.pem

# Extract private key (enter p12 password when prompted)
openssl pkcs12 -in mycert.p12 -nocerts -nodes -out key.pem
```

Then pass them to the client:

```typescript
import fs from 'node:fs';

const client = new MyInvoisClient({
  // ...
  certificate: {
    cert: fs.readFileSync('cert.pem', 'utf8'),
    privateKey: fs.readFileSync('key.pem', 'utf8'),
  },
});
```

Keep your private key out of source control. Use environment variables or a secrets manager.

---

## Advanced: sign manually

If you need to sign before submitting (e.g. to inspect the signature output):

```typescript
import { XadesSigner } from '@obsidia-my/myinvois-sdk';
import { JsonSerialiser } from '@obsidia-my/myinvois-sdk';
import { minifyJson } from '@obsidia-my/myinvois-sdk';

const serialiser = new JsonSerialiser();
const signer = new XadesSigner(certPem, privateKeyPem);

const json = serialiser.toObject(invoice);
const signed = signer.sign({
  document: minifyJson(json),
  format: 'json',
  signingTime: '2024-01-15T08:30:00Z',   // optional; defaults to now
});

console.log(signed.computed.certDigest);
console.log(signed.computed.docDigest);
console.log(signed.signatureXml);         // the ds:Signature block
```

---

## Status note

The XAdES output structure has been verified against the [LHDN reference signed XML](https://sdk.myinvois.hasil.gov.my/files/one-doc-signed.xml). All required elements are produced in the correct order and with the correct algorithm URIs. End-to-end confirmation against the live sandbox is pending — if you run a successful submission, please share the result in a GitHub issue.
