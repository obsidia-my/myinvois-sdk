import type {
  BaseDocument,
  Party,
  InvoiceLine,
  TaxTotal,
  MonetaryTotal,
  BillingReference,
  PaymentMeans,
  DocumentTypeCode,
  AdditionalDocumentReference,
} from '../types/common';
import { DocumentValidator, type ValidationResult } from '../validator/DocumentValidator';
import { ValidationError } from '../../errors/ValidationError';

export abstract class BaseBuilder<T extends BaseDocument> {
  protected doc: Partial<T> = {} as Partial<T>;

  protected abstract defaultTypeCode(): DocumentTypeCode;

  id(value: string): this {
    this.doc.id = value;
    return this;
  }

  issueDate(value: string): this {
    this.doc.issueDate = value;
    return this;
  }

  issueTime(value: string): this {
    this.doc.issueTime = value;
    return this;
  }

  currency(code: string, exchangeRate?: number): this {
    this.doc.currencyCode = code;
    if (exchangeRate !== undefined) this.doc.exchangeRate = exchangeRate;
    return this;
  }

  supplier(p: Party): this {
    this.doc.supplier = p;
    return this;
  }

  buyer(p: Party): this {
    this.doc.buyer = p;
    return this;
  }

  addLine(line: InvoiceLine): this {
    if (!this.doc.lines) this.doc.lines = [];
    this.doc.lines.push(line);
    return this;
  }

  taxTotal(t: TaxTotal): this {
    this.doc.taxTotal = t;
    return this;
  }

  totals(m: MonetaryTotal): this {
    this.doc.legalMonetaryTotal = m;
    return this;
  }

  billingReference(b: BillingReference): this {
    this.doc.billingReference = b;
    return this;
  }

  paymentMeans(p: PaymentMeans): this {
    this.doc.paymentMeans = p;
    return this;
  }

  paymentTerms(value: string): this {
    this.doc.paymentTerms = value;
    return this;
  }

  note(value: string): this {
    this.doc.note = value;
    return this;
  }

  additionalDocumentReference(refs: AdditionalDocumentReference[]): this {
    this.doc.additionalDocumentReference = refs;
    return this;
  }

  validate(): ValidationResult {
    return new DocumentValidator().validate(this.assemble());
  }

  build(): T {
    const assembled = this.assemble();
    const result = new DocumentValidator().validate(assembled);
    if (!result.isValid) {
      throw new ValidationError(
        'Document failed validation',
        result.errors.map((e) => ({ field: e.path, message: e.message })),
      );
    }
    return assembled;
  }

  private assemble(): T {
    if (!this.doc.invoiceTypeCode) {
      this.doc.invoiceTypeCode = this.defaultTypeCode();
    }
    if (!this.doc.taxTotal && this.doc.lines) {
      this.doc.taxTotal = this.deriveTaxTotal();
    }
    if (!this.doc.issueTime) {
      this.doc.issueTime = '00:00:00Z';
    }
    return this.doc as T;
  }

  private deriveTaxTotal(): TaxTotal {
    const lines = this.doc.lines ?? [];
    const taxAmount = round2(lines.reduce((s, l) => s + (l.taxCategory?.taxAmount ?? 0), 0));
    return {
      taxAmount,
      taxSubtotals: lines.map((l) => ({
        taxableAmount: l.taxCategory.taxableAmount,
        taxAmount: l.taxCategory.taxAmount,
        taxCategory: { taxType: l.taxCategory.taxType, taxRate: l.taxCategory.taxRate },
      })),
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
