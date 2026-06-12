import { BaseBuilder } from './BaseBuilder';
import type { DebitNoteDocument } from '../types/debit-note';
import type { DocumentTypeCode } from '../types/common';

export class DebitNoteBuilder extends BaseBuilder<DebitNoteDocument> {
  protected defaultTypeCode(): DocumentTypeCode {
    return '03';
  }
}
