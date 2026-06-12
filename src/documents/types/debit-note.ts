import type { BaseDocument, BillingReference } from './common';

export interface DebitNoteDocument extends BaseDocument {
  invoiceTypeCode?: '03';
  billingReference: BillingReference;
}
