import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from './api-error';

/** Cuerpo de error que produce GlobalExceptionHandler en el backend. */
interface CuerpoErrorBackend {
  message?: string;
  errors?: Record<string, string>;
}

const MENSAJES_POR_ESTADO: Record<number, string> = {
  0: 'No se pudo contactar con el servidor. Comprueba que el backend esté en marcha en el puerto 8080.',
  401: 'La sesión no está autorizada para realizar esta acción.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado ya no existe. Puede que la lista esté desactualizada.',
  409: 'La solicitud fue modificada por otra persona. Actualiza la lista e inténtalo de nuevo.',
  500: 'El servidor encontró un error inesperado. Inténtalo de nuevo en unos momentos.',
  503: 'El servicio no está disponible en este momento. Inténtalo de nuevo en unos momentos.',
};

/**
 * Centraliza el manejo de errores HTTP: prioriza el mensaje que envía la API y
 * solo recurre a un texto por código cuando el backend no aporta ninguno.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const cuerpo: CuerpoErrorBackend =
        typeof error.error === 'object' && error.error !== null ? error.error : {};

      const apiError: ApiError = {
        status: error.status,
        message:
          cuerpo.message?.trim() ||
          MENSAJES_POR_ESTADO[error.status] ||
          'Ocurrió un error inesperado al comunicarse con el servidor.',
        errors: cuerpo.errors ?? {},
      };

      return throwError(() => apiError);
    }),
  );
