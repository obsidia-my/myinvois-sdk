import { BaseBuilder } from './BaseBuilder';
import type { InvoiceDocument } from '../types/invoice';
import type { DocumentTypeCode } from '../types/common';

export class InvoiceBuilder extends BaseBuilder<InvoiceDocument> {
  protected defaultTypeCode(): DocumentTypeCode {
    return '01';
  }
}
