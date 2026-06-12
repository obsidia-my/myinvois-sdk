import type { BaseDocument } from './common';

export interface SelfBilledInvoiceDocument extends BaseDocument {
  invoiceTypeCode?: '11';
}

export interface SelfBilledCreditNoteDocument extends BaseDocument {
  invoiceTypeCode?: '12';
}

export interface SelfBilledDebitNoteDocument extends BaseDocument {
  invoiceTypeCode?: '13';
}

export interface SelfBilledRefundNoteDocument extends BaseDocument {
  invoiceTypeCode?: '14';
}
