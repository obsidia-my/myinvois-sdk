import { MyInvoisError, type ErrorDetail } from './MyInvoisError';

export class ApiError extends MyInvoisError {
  constructor(message: string, code: string, statusCode: number, details?: ErrorDetail[]) {
    super(message, code, statusCode, details);
    this.name = 'ApiError';
  }
}
