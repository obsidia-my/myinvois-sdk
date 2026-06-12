import type { HttpClient } from '../../client/http/HttpClient';

export interface DocumentType {
  id: number;
  invoiceTypeCode: number;
  description: string;
  activeFrom: string;
  activeTo?: string;
}

export class DocumentTypesApi {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<{ result: DocumentType[] }> {
    return this.http.get('/api/v1.0/documenttypes');
  }

  get(id: number): Promise<DocumentType> {
    return this.http.get(`/api/v1.0/documenttypes/${id}`);
  }

  getVersion(id: number, versionId: number): Promise<unknown> {
    return this.http.get(`/api/v1.0/documenttypes/${id}/versions/${versionId}`);
  }
}
