export interface ApiErrorPayload {
  message: string;
  code: string;
  errors?: Record<string, readonly string[]>;
}

export class FormValidationError extends Error {
  constructor(readonly errors: Record<string, readonly string[]>) {
    super('The submitted form contains invalid fields.');
  }
}
