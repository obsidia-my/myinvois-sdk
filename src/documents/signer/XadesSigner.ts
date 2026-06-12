import { createSign, createHash } from 'crypto';
import { CertificateLoader, type LoadedCertificate } from './CertificateLoader';
import { canonicaliseXml } from './Canonicaliser';

const C14N_ALG = 'http://www.w3.org/2001/10/xml-exc-c14n#';
const SIG_METHOD = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
const SHA256 = 'http://www.w3.org/2001/04/xmlenc#sha256';
const XPATH_ALG = 'http://www.w3.org/TR/1999/REC-xpath-19991116';
const EXC_C14N_ALG = 'http://www.w3.org/2001/10/xml-exc-c14n#';

export interface SignerInputs {
  document: string; // minified UBL document (XML or JSON string)
  format: 'xml' | 'json';
  signingTime?: string; // UTC ISO timestamp; defaults to now
}

export interface SignerComputed {
  certDigest: string;
  docDigest: string;
  propsDigest: string;
  signatureValue: string;
}

export interface SignedDocument {
  signatureXml: string;
  computed: SignerComputed;
}

function sha256HexToBase64(input: Buffer | string): string {
  const hex = createHash('sha256').update(input).digest('hex');
  return Buffer.from(hex, 'hex').toString('base64');
}

function sha256Base64OfString(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('base64');
}

export class XadesSigner {
  private readonly cert: LoadedCertificate;
  private readonly privateKeyPem: string;

  constructor(certPem: string, privateKeyPem: string) {
    this.cert = CertificateLoader.load(certPem);
    this.privateKeyPem = privateKeyPem;
  }

  sign(inputs: SignerInputs): SignedDocument {
    const signingTime = inputs.signingTime ?? new Date().toISOString().replace(/\.\d+Z$/, 'Z');

    // 1. CertDigest — SHA256 of cert DER bytes, hex → base64.
    const certDigest = sha256HexToBase64(this.cert.derBytes);

    // 2. DocDigest — SHA256 of the canonicalised document content after transforms.
    //    For XML: apply C14N11 with LHDN XPath transforms (strip UBLExtensions + cac:Signature).
    //    For JSON: hash the minified JSON string directly (no c14n applicable).
    const docDigest =
      inputs.format === 'xml'
        ? sha256Base64OfString(canonicaliseXml(inputs.document))
        : sha256Base64OfString(inputs.document);

    // 3. Build signed QualifyingProperties and compute PropsDigest.
    const signedProperties = this.buildSignedProperties(signingTime, certDigest);
    const propsDigest = sha256Base64OfString(signedProperties);

    // 4. Build SignedInfo and RSA-SHA256 sign it.
    const signedInfo = this.buildSignedInfo(docDigest, propsDigest);
    const signer = createSign('RSA-SHA256');
    signer.update(signedInfo);
    signer.end();
    const signatureValue = signer.sign(this.privateKeyPem, 'base64');

    const signatureXml = this.assembleSignatureXml({
      signedInfo,
      signatureValue,
      certBase64: this.cert.derBase64,
      issuerName: this.cert.issuerName,
      serialNumber: this.cert.serialNumber,
      signedProperties,
    });

    return {
      signatureXml,
      computed: { certDigest, docDigest, propsDigest, signatureValue },
    };
  }

  private buildSignedProperties(signingTime: string, certDigest: string): string {
    return (
      `<xades:SignedProperties Id="id-xades-signed-props">` +
      `<xades:SignedSignatureProperties>` +
      `<xades:SigningTime>${signingTime}</xades:SigningTime>` +
      `<xades:SigningCertificate>` +
      `<xades:Cert>` +
      `<xades:CertDigest>` +
      `<ds:DigestMethod Algorithm="${SHA256}"/>` +
      `<ds:DigestValue>${certDigest}</ds:DigestValue>` +
      `</xades:CertDigest>` +
      `<xades:IssuerSerial>` +
      `<ds:X509IssuerName>${escapeXml(this.cert.issuerName)}</ds:X509IssuerName>` +
      `<ds:X509SerialNumber>${this.cert.serialNumber}</ds:X509SerialNumber>` +
      `</xades:IssuerSerial>` +
      `</xades:Cert>` +
      `</xades:SigningCertificate>` +
      `</xades:SignedSignatureProperties>` +
      `</xades:SignedProperties>`
    );
  }

  private buildSignedInfo(docDigest: string, propsDigest: string): string {
    return (
      `<ds:SignedInfo>` +
      `<ds:CanonicalizationMethod Algorithm="${C14N_ALG}"/>` +
      `<ds:SignatureMethod Algorithm="${SIG_METHOD}"/>` +
      `<ds:Reference Id="id-doc-signed-data" URI="">` +
      `<ds:Transforms>` +
      `<ds:Transform Algorithm="${XPATH_ALG}">` +
      `<ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath>` +
      `</ds:Transform>` +
      `<ds:Transform Algorithm="${XPATH_ALG}">` +
      `<ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath>` +
      `</ds:Transform>` +
      `<ds:Transform Algorithm="${EXC_C14N_ALG}"/>` +
      `</ds:Transforms>` +
      `<ds:DigestMethod Algorithm="${SHA256}"/>` +
      `<ds:DigestValue>${docDigest}</ds:DigestValue>` +
      `</ds:Reference>` +
      `<ds:Reference URI="#id-xades-signed-props">` +
      `<ds:DigestMethod Algorithm="${SHA256}"/>` +
      `<ds:DigestValue>${propsDigest}</ds:DigestValue>` +
      `</ds:Reference>` +
      `</ds:SignedInfo>`
    );
  }

  private assembleSignatureXml(p: {
    signedInfo: string;
    signatureValue: string;
    certBase64: string;
    issuerName: string;
    serialNumber: string;
    signedProperties: string;
  }): string {
    return (
      `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" ` +
      `xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="signature">` +
      p.signedInfo +
      `<ds:SignatureValue ID="DocSigValue">${p.signatureValue}</ds:SignatureValue>` +
      `<ds:KeyInfo>` +
      `<ds:X509Data>` +
      `<ds:X509Certificate>${p.certBase64}</ds:X509Certificate>` +
      `</ds:X509Data>` +
      `</ds:KeyInfo>` +
      `<ds:Object>` +
      `<xades:QualifyingProperties Target="signature">` +
      p.signedProperties +
      `</xades:QualifyingProperties>` +
      `</ds:Object>` +
      `</ds:Signature>`
    );
  }

  // Returns the full UBLExtensions + cac:Signature blocks for embedding in XML.
  static buildUblExtensionsXml(signatureXml: string): string {
    const NS_EXT = 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2';
    const NS_SIG = 'urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2';
    const NS_SAC = 'urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2';
    const NS_SBC = 'urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2';
    return (
      `<UBLExtensions xmlns="${NS_EXT}">` +
      `<UBLExtension>` +
      `<ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ExtensionURI>` +
      `<ExtensionContent>` +
      `<sig:UBLDocumentSignatures xmlns:sig="${NS_SIG}" xmlns:sac="${NS_SAC}" xmlns:sbc="${NS_SBC}">` +
      `<sac:SignatureInformation>` +
      `<cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>` +
      `<sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>` +
      signatureXml +
      `</sac:SignatureInformation>` +
      `</sig:UBLDocumentSignatures>` +
      `</ExtensionContent>` +
      `</UBLExtension>` +
      `</UBLExtensions>`
    );
  }

  static buildCacSignatureXml(): string {
    return (
      `<cac:Signature>` +
      `<cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>` +
      `<cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>` +
      `</cac:Signature>`
    );
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
