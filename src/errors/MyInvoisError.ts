export interface ErrorDetail {
  code: string;
  message: string;
  target?: string;
  propertyPath?: string;
}

export class MyInvoisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'MyInvoisError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
