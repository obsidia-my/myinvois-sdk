import type { HttpClient } from '../../client/http/HttpClient';

export class DocumentStateApi {
  constructor(private readonly http: HttpClient) {}

  cancel(uuid: string, reason: string): Promise<void> {
    return this.http.put(`/api/v1.0/documents/state/${uuid}/state`, {
      status: 'cancelled',
      reason,
    });
  }

  reject(uuid: string, reason: string): Promise<void> {
    return this.http.put(`/api/v1.0/documents/state/${uuid}/state`, {
      status: 'rejected',
      reason,
    });
  }
}
