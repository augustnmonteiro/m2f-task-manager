export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'EXPIRED_TOKEN'
  | 'TOKEN_ALREADY_USED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export type AppError = {
  code: AppErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function err(error: AppError): ActionResult<never> {
  return { ok: false, error };
}
