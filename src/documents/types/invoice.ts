import type { BaseDocument } from './common';

export interface InvoiceDocument extends BaseDocument {
  invoiceTypeCode?: '01';
}
