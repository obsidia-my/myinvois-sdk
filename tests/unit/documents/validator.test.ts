import { DocumentValidator } from '../../../src/documents/validator/DocumentValidator';
import { sampleInvoice } from '../../fixtures/sample-invoice';

describe('DocumentValidator', () => {
  const v = new DocumentValidator();

  it('passes for a valid invoice', () => {
    expect(v.validate(sampleInvoice).isValid).toBe(true);
  });

  it('rejects bad date format', () => {
    const r = v.validate({ ...sampleInvoice, issueDate: '15/01/2024' });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.path === 'issueDate')).toBe(true);
  });

  it('rejects state code 00', () => {
    const r = v.validate({
      ...sampleInvoice,
      supplier: {
        ...sampleInvoice.supplier,
        address: { ...sampleInvoice.supplier.address, countrySubentityCode: '00' },
      },
    });
    expect(r.isValid).toBe(false);
  });

  it('rejects mismatched lineExtensionAmount', () => {
    const r = v.validate({
      ...sampleInvoice,
      legalMonetaryTotal: { ...sampleInvoice.legalMonetaryTotal, lineExtensionAmount: 9999 },
    });
    expect(r.isValid).toBe(false);
  });

  it('requires exemption reason for taxType E', () => {
    const r = v.validate({
      ...sampleInvoice,
      lines: [
        {
          ...sampleInvoice.lines[0]!,
          taxCategory: { taxType: 'E', taxRate: 0, taxableAmount: 5000, taxAmount: 0 },
        },
      ],
      taxTotal: {
        taxAmount: 0,
        taxSubtotals: [
          { taxableAmount: 5000, taxAmount: 0, taxCategory: { taxType: 'E', taxRate: 0 } },
        ],
      },
      legalMonetaryTotal: {
        ...sampleInvoice.legalMonetaryTotal,
        taxInclusiveAmount: 5000,
        payableAmount: 5000,
      },
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.path.includes('exemptionReason'))).toBe(true);
  });
});
