import { BaseBuilder } from './BaseBuilder';
import type { SelfBilledInvoiceDocument } from '../types/self-billed';
import type { DocumentTypeCode } from '../types/common';

export class SelfBilledInvoiceBuilder extends BaseBuilder<SelfBilledInvoiceDocument> {
  protected defaultTypeCode(): DocumentTypeCode {
    return '11';
  }
}
