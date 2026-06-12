import { MyInvoisError } from './MyInvoisError';

export class RateLimitError extends MyInvoisError {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}
