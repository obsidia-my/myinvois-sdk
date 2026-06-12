import type { ErrorDetail } from '../../errors/MyInvoisError';

export interface SubmitDocumentPayload {
  format: 'JSON' | 'XML';
  document: string; // base64 encoded
  documentHash: string; // SHA256 hex of original document
  codeNumber: string;
}

export interface SubmitDocumentsRequest {
  documents: SubmitDocumentPayload[];
}

export interface AcceptedDocument {
  uuid: string;
  invoiceCodeNumber: string;
}

export interface RejectedDocument {
  invoiceCodeNumber: string;
  error: { code: string; message: string; target?: string; details?: ErrorDetail[] };
}

export interface SubmissionResult {
  submissionUid: string;
  acceptedDocuments: AcceptedDocument[];
  rejectedDocuments: RejectedDocument[];
}

export interface SubmissionStatus {
  submissionUid: string;
  documentCount: number;
  dateTimeReceived: string;
  overallStatus: 'in progress' | 'valid' | 'partially valid' | 'invalid';
  documentSummary: Array<{
    uuid: string;
    submissionUid: string;
    longId?: string;
    internalId: string;
    typeName: string;
    typeVersionName: string;
    issuerTin: string;
    issuerName: string;
    receiverId?: string;
    receiverName?: string;
    dateTimeIssued: string;
    dateTimeReceived: string;
    dateTimeValidated?: string;
    totalSales: number;
    totalDiscount: number;
    netAmount: number;
    total: number;
    status: string;
    cancelDateTime?: string;
    rejectRequestDateTime?: string;
    documentStatusReason?: string;
    createdByUserId?: string;
  }>;
}

export interface SearchDocumentsParams {
  uuid?: string;
  submissionDateFrom?: string;
  submissionDateTo?: string;
  pageSize?: number;
  pageNo?: number;
  issueDateFrom?: string;
  issueDateTo?: string;
  direction?: 'sent' | 'received';
  status?: 'Valid' | 'Invalid' | 'Cancelled' | 'Submitted';
  documentType?: string;
  receiverIdType?: string;
  receiverId?: string;
  receiverTin?: string;
  issuerTin?: string;
  issuerIdType?: string;
  issuerId?: string;
}

export interface DocumentListItem {
  uuid: string;
  submissionUid: string;
  longId?: string;
  internalId: string;
  typeName: string;
  typeVersionName: string;
  issuerTin: string;
  issuerName: string;
  receiverId?: string;
  receiverName?: string;
  dateTimeIssued: string;
  dateTimeReceived: string;
  dateTimeValidated?: string;
  totalSales: number;
  totalDiscount: number;
  netAmount: number;
  total: number;
  status: string;
}

export interface DocumentList {
  result: DocumentListItem[];
  metadata: { totalPages: number; totalCount: number };
}

export interface DocumentSource {
  uuid: string;
  submissionUid: string;
  longId?: string;
  internalId: string;
  typeName: string;
  typeVersionName: string;
  status: string;
  document: string; // base64-encoded source document
}

export interface DocumentDetails extends DocumentListItem {
  validationResults?: {
    status: string;
    validationSteps: Array<{ name: string; status: string; error?: unknown }>;
  };
}
