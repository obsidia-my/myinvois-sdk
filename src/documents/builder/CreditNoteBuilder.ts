import { BaseBuilder } from './BaseBuilder';
import type { CreditNoteDocument } from '../types/credit-note';
import type { DocumentTypeCode } from '../types/common';

export class CreditNoteBuilder extends BaseBuilder<CreditNoteDocument> {
  protected defaultTypeCode(): DocumentTypeCode {
    return '02';
  }
}
