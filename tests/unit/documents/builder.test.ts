import { InvoiceBuilder } from '../../../src/documents/builder/InvoiceBuilder';
import { ValidationError } from '../../../src/errors/ValidationError';
import { sampleInvoice } from '../../fixtures/sample-invoice';

describe('InvoiceBuilder', () => {
  it('builds a valid invoice with fluent API', () => {
    const b = new InvoiceBuilder()
      .id(sampleInvoice.id)
      .issueDate(sampleInvoice.issueDate)
      .issueTime(sampleInvoice.issueTime)
      .currency(sampleInvoice.currencyCode)
      .supplier(sampleInvoice.supplier)
      .buyer(sampleInvoice.buyer)
      .addLine(sampleInvoice.lines[0]!)
      .totals(sampleInvoice.legalMonetaryTotal);
    const doc = b.build();
    expect(doc.id).toBe('INV-2024-001');
    expect(doc.invoiceTypeCode).toBe('01');
    expect(doc.taxTotal.taxAmount).toBe(400);
  });

  it('throws ValidationError on invalid state code 00', () => {
    expect(() =>
      new InvoiceBuilder()
        .id('X')
        .issueDate('2024-01-15')
        .issueTime('00:00:00Z')
        .currency('MYR')
        .supplier({
          ...sampleInvoice.supplier,
          address: { ...sampleInvoice.supplier.address, countrySubentityCode: '00' },
        })
        .buyer(sampleInvoice.buyer)
        .addLine(sampleInvoice.lines[0]!)
        .totals(sampleInvoice.legalMonetaryTotal)
        .build(),
    ).toThrow(ValidationError);
  });

  it('requires exchange rate when currency is not MYR', () => {
    try {
      new InvoiceBuilder()
        .id('X')
        .issueDate('2024-01-15')
        .issueTime('00:00:00Z')
        .currency('USD')
        .supplier(sampleInvoice.supplier)
        .buyer(sampleInvoice.buyer)
        .addLine(sampleInvoice.lines[0]!)
        .totals(sampleInvoice.legalMonetaryTotal)
        .build();
      fail('expected ValidationError');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).fields.some((f) => f.field === 'exchangeRate')).toBe(true);
    }
  });
});
