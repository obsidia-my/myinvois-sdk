import { MyInvoisError } from './MyInvoisError';

export interface ValidationFailure {
  field: string;
  message: string;
}

export class ValidationError extends MyInvoisError {
  constructor(
    message: string,
    public readonly fields: ValidationFailure[],
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
