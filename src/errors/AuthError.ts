import { MyInvoisError } from './MyInvoisError';

export class AuthError extends MyInvoisError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}
