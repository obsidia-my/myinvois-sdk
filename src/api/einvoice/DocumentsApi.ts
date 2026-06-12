import type { HttpClient } from '../../client/http/HttpClient';
import type {
  DocumentList,
  DocumentSource,
  DocumentDetails,
  SearchDocumentsParams,
  SubmissionStatus,
} from './types';

export interface GetRecentDocumentsParams {
  pageNo?: number;
  pageSize?: number;
  submissionDateFrom?: string;
  submissionDateTo?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
  direction?: 'sent' | 'received';
  status?: 'valid' | 'invalid' | 'cancelled' | 'rejected';
}

export class DocumentsApi {
  constructor(private readonly http: HttpClient) {}

  getSubmission(submissionUid: string): Promise<SubmissionStatus> {
    return this.http.get(`/api/v1.0/documentsubmissions/${submissionUid}`);
  }

  getDocument(uuid: string): Promise<DocumentSource> {
    return this.http.get(`/api/v1.0/documents/${uuid}/raw`);
  }

  getDocumentDetails(uuid: string): Promise<DocumentDetails> {
    return this.http.get(`/api/v1.0/documents/${uuid}/details`);
  }

  getRecent(params: GetRecentDocumentsParams = {}): Promise<DocumentList> {
    return this.http.get('/api/v1.0/documents/recent', {
      query: params as Record<string, string | number | undefined>,
    });
  }

  search(params: SearchDocumentsParams): Promise<DocumentList> {
    return this.http.get('/api/v1.0/documents', {
      query: params as Record<string, string | number | undefined>,
    });
  }
}
