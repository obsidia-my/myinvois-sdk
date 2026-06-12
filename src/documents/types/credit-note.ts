import type { BaseDocument, BillingReference } from './common';

export interface CreditNoteDocument extends BaseDocument {
  invoiceTypeCode?: '02';
  billingReference: BillingReference;
}
