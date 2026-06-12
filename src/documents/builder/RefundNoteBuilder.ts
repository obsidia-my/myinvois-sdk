import { BaseBuilder } from './BaseBuilder';
import type { RefundNoteDocument } from '../types/refund-note';
import type { DocumentTypeCode } from '../types/common';

export class RefundNoteBuilder extends BaseBuilder<RefundNoteDocument> {
  protected defaultTypeCode(): DocumentTypeCode {
    return '04';
  }
}
