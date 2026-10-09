import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody, ApiFieldError } from './models';

const FALLBACK_MESSAGE = 'Ocurrió un error inesperado';

function bodyOf(error: unknown): Partial<ApiErrorBody> | undefined {
  if (!(error instanceof HttpErrorResponse)) return undefined;
  return typeof error.error === 'object' && error.error !== null ? error.error : undefined;
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'No se pudo conectar con la API. ¿Está corriendo `npm run api`?';
  }
  return bodyOf(error)?.message ?? (error instanceof Error ? error.message : FALLBACK_MESSAGE);
}

export function apiFieldErrors(error: unknown): ApiFieldError[] {
  return bodyOf(error)?.errors ?? [];
}
