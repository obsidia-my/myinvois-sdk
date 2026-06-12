export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface TokenManagerConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  tin: string;
  onBehalfOfTin?: string;
  scope?: string;
  fetchImpl?: typeof fetch;
}
