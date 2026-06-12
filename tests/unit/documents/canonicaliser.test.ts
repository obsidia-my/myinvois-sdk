import * as fs from 'fs';
import * as path from 'path';
import { canonicaliseXml } from '../../../src/documents/signer/Canonicaliser';

const FIXTURE = path.join(__dirname, '../../fixtures/lhdn-one-doc-signed.xml');

describe('canonicaliseXml', () => {
  it('produces non-empty output for valid XML', () => {
    const xml = '<Invoice xmlns:cbc="urn:x"><cbc:ID>1</cbc:ID></Invoice>';
    const result = canonicaliseXml(xml);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('<Invoice');
    expect(result).toContain('</Invoice>');
  });

  it('strips UBLExtensions element', () => {
    const xml =
      '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">' +
      '<UBLExtensions xmlns="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">' +
      '<UBLExtension><ExtensionURI>test</ExtensionURI></UBLExtension>' +
      '</UBLExtensions>' +
      '<cbc:ID xmlns:cbc="urn:x">INV-001</cbc:ID>' +
      '</Invoice>';
    const result = canonicaliseXml(xml);
    expect(result).not.toContain('UBLExtensions');
    expect(result).not.toContain('ExtensionURI');
    expect(result).toContain('INV-001');
  });

  it('strips cac:Signature element', () => {
    const xml =
      '<Invoice xmlns:cac="urn:a" xmlns:cbc="urn:b">' +
      '<cac:Signature><cbc:ID>sig-1</cbc:ID></cac:Signature>' +
      '<cbc:ID>INV-002</cbc:ID>' +
      '</Invoice>';
    const result = canonicaliseXml(xml);
    expect(result).not.toContain('cac:Signature');
    expect(result).not.toContain('sig-1');
    expect(result).toContain('INV-002');
  });

  it('escapes special characters in text nodes', () => {
    const xml = '<Invoice xmlns:cbc="urn:x"><cbc:Note>A &amp; B &lt;test&gt;</cbc:Note></Invoice>';
    const result = canonicaliseXml(xml);
    expect(result).toContain('A &amp; B &lt;test&gt;');
  });

  it('renders namespace attrs sorted alphabetically (exc-c14n: only utilized ones)', () => {
    // Both prefixes are actually used in child elements so both must appear.
    const xml =
      '<Invoice xmlns:cbc="urn:x" xmlns:cac="urn:y">' +
      '<cac:Party><cbc:ID>1</cbc:ID></cac:Party>' +
      '</Invoice>';
    const result = canonicaliseXml(xml);
    // Both used namespace attrs should appear
    expect(result).toContain('xmlns:cac="urn:y"');
    expect(result).toContain('xmlns:cbc="urn:x"');
    // cac comes before cbc alphabetically in sorted namespace output
    const cacPos = result.indexOf('xmlns:cac');
    const cbcPos = result.indexOf('xmlns:cbc');
    expect(cacPos).toBeLessThan(cbcPos);
  });

  it('processes the LHDN sample reference XML without error', () => {
    const xml = fs.readFileSync(FIXTURE, 'utf8');
    // The sample already contains UBLExtensions — canonicalising should strip it.
    const result = canonicaliseXml(xml);
    expect(result.length).toBeGreaterThan(100);
    expect(result).not.toContain('<UBLExtensions');
    expect(result).not.toContain('<cac:Signature>');
    // Core invoice fields should survive
    expect(result).toContain('XML-INV12345');
  });

  it('returns empty string when root itself is an excluded tag', () => {
    const xml = '<UBLExtensions><child/></UBLExtensions>';
    const result = canonicaliseXml(xml);
    expect(result).toBe('');
  });
});
