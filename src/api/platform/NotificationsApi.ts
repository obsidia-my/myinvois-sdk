import type { HttpClient } from '../../client/http/HttpClient';

export interface NotificationsParams {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  language?: 'ms' | 'en';
  status?: string;
  channel?: string;
  pageNo?: number;
  pageSize?: number;
}

export interface Notification {
  notificationId: string;
  receiverName: string;
  notificationDeliveryId: string;
  creationDateTime: string;
  receivedDateTime?: string;
  notificationSubject: string;
  deliveredDateTime?: string;
  typeId: string;
  typeName: string;
  finalMessage?: string;
  address?: string;
  language?: string;
  status?: string;
  deliveryChannel?: string;
}

export class NotificationsApi {
  constructor(private readonly http: HttpClient) {}

  list(params: NotificationsParams = {}): Promise<{ result: Notification[] }> {
    return this.http.get('/api/v1.0/notifications/taxpayer', { query: params as Record<string, string | number | undefined> });
  }
}
