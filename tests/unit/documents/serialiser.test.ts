import { JsonSerialiser } from '../../../src/documents/serialiser/JsonSerialiser';
import { XmlSerialiser } from '../../../src/documents/serialiser/XmlSerialiser';
import { sampleInvoice } from '../../fixtures/sample-invoice';

describe('JsonSerialiser', () => {
  it('produces UBL JSON envelope with Invoice array', () => {
    const obj = new JsonSerialiser().toObject(sampleInvoice) as Record<string, unknown>;
    expect(Array.isArray(obj.Invoice)).toBe(true);
    const inv = (obj.Invoice as Array<Record<string, unknown>>)[0]!;
    expect(((inv.ID as Array<{ _: string }>)[0]!._)).toBe('INV-2024-001');
  });

  it('serialise returns valid JSON string', () => {
    const s = new JsonSerialiser().serialise(sampleInvoice);
    expect(() => JSON.parse(s)).not.toThrow();
  });
});

describe('XmlSerialiser', () => {
  it('emits Invoice root with required namespaces', () => {
    const xml = new XmlSerialiser().serialise(sampleInvoice);
    expect(xml).toMatch(/<Invoice /);
    expect(xml).toContain('xmlns:cac=');
    expect(xml).toContain('xmlns:cbc=');
    expect(xml).toContain('<cbc:ID>INV-2024-001</cbc:ID>');
  });

  it('escapes special XML characters', () => {
    const xml = new XmlSerialiser().serialise({
      ...sampleInvoice,
      note: 'A & B <test>',
    });
    expect(xml).toContain('A &amp; B &lt;test&gt;');
  });
});
