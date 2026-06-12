import type { BaseDocument, BillingReference } from './common';

export interface RefundNoteDocument extends BaseDocument {
  invoiceTypeCode?: '04';
  billingReference: BillingReference;
}
