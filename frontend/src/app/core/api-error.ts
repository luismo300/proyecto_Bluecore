/**
 * Error normalizado que circula por la aplicación.
 *
 * El interceptor convierte cualquier fallo de HttpClient en esta forma, para que
 * los componentes nunca tengan que interpretar códigos HTTP ni cuerpos crudos.
 */
export interface ApiError {
  /** Código HTTP, o 0 si la petición no llegó a salir. */
  status: number;
  /** Texto listo para mostrar al usuario, en español. */
  message: string;
  /** Mensajes por campo devueltos por el backend, p. ej. { monto: '...' }. */
  errors: Record<string, string>;
}

export function esApiError(valor: unknown): valor is ApiError {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'status' in valor &&
    'message' in valor &&
    'errors' in valor
  );
}
