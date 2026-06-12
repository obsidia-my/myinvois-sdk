import * as forge from 'node-forge';

export interface LoadedCertificate {
  pem: string;
  derBase64: string;
  derBytes: Buffer;
  issuerName: string;
  serialNumber: string;
  subjectCN: string;
}

export class CertificateLoader {
  static load(pem: string): LoadedCertificate {
    const cert = forge.pki.certificateFromPem(pem);
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const derBytes = Buffer.from(der, 'binary');

    const issuerAttrs = cert.issuer.attributes
      .map((a) => `${a.shortName ?? a.name}=${String(a.value)}`)
      .join(', ');

    const cnField: unknown = cert.subject.getField('CN');
    const subjectCN =
      cnField && typeof cnField === 'object' && 'value' in cnField && typeof (cnField as { value: unknown }).value === 'string'
        ? (cnField as { value: string }).value
        : '';

    return {
      pem,
      derBase64: derBytes.toString('base64'),
      derBytes,
      issuerName: issuerAttrs,
      serialNumber: cert.serialNumber,
      subjectCN,
    };
  }
}
