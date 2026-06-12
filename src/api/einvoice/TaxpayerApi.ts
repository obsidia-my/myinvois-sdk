import type { HttpClient } from '../../client/http/HttpClient';

export type IdType = 'NRIC' | 'PASSPORT' | 'BRN' | 'ARMY';

export interface SearchTinParams {
  taxpayerName?: string;
  idType?: IdType;
  idValue?: string;
}

export interface TaxpayerInfo {
  tin: string;
  name: string;
  idType?: IdType;
  idValue?: string;
}

export class TaxpayerApi {
  constructor(private readonly http: HttpClient) {}

  async validateTin(tin: string, idType: IdType, idValue: string): Promise<boolean> {
    try {
      await this.http.get(`/api/v1.0/taxpayer/validate/${tin}`, {
        query: { idType, idValue },
      });
      return true;
    } catch {
      return false;
    }
  }

  searchTin(params: SearchTinParams): Promise<TaxpayerInfo[]> {
    return this.http.get('/api/v1.0/taxpayer/search/tin', {
      query: params as Record<string, string | number | undefined>,
    });
  }

  getQrCodeInfo(qrCodeToken: string): Promise<TaxpayerInfo> {
    return this.http.get('/api/v1.0/taxpayer/qrcode', { query: { qrCodeToken } });
  }
}
