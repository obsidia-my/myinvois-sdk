import type { HttpClient } from '../../client/http/HttpClient';
import type { SubmitDocumentsRequest, SubmissionResult } from './types';

export class SubmitDocumentsApi {
  constructor(private readonly http: HttpClient) {}

  submit(req: SubmitDocumentsRequest): Promise<SubmissionResult> {
    return this.http.post('/api/v1.0/documentsubmissions/', req);
  }
}
