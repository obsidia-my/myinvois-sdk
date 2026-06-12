export interface HttpClientConfig {
  baseUrl: string;
  getToken: () => Promise<string>;
  timeout?: number;
  retries?: number;
  debug?: boolean;
  fetchImpl?: typeof fetch;
  onUnauthorized?: () => void;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | undefined>;
}
