import { AuthError } from '../../errors/AuthError';
import type { TokenManagerConfig, TokenResponse } from './types';

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export class TokenManager {
  private token: string | null = null;
  private expiresAt = 0;
  private inFlight: Promise<string> | null = null;

  constructor(private readonly config: TokenManagerConfig) {}

  async getValidToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt - REFRESH_BUFFER_MS) {
      return this.token;
    }
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.fetchToken().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  invalidate(): void {
    this.token = null;
    this.expiresAt = 0;
  }

  private async fetchToken(): Promise<string> {
    const fetchImpl = this.config.fetchImpl ?? fetch;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: `${this.config.tin}_${this.config.clientId}`,
      client_secret: this.config.clientSecret,
      scope: this.config.scope ?? 'InvoicingAPI',
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (this.config.onBehalfOfTin) {
      headers['onbehalfof'] = this.config.onBehalfOfTin;
    }
    const res = await fetchImpl(this.config.tokenUrl, {
      method: 'POST',
      headers,
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new AuthError(`Token request failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as TokenResponse;
    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
    return this.token;
  }
}
