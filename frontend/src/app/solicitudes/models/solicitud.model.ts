/** Estados que maneja el backend (enum `EstadoSolicitud`). */
export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

/** Valor adicional que solo existe en la UI del filtro. */
export type FiltroEstado = EstadoSolicitud | 'TODOS';

/** Solicitud tal y como la devuelve la API. */
export interface Solicitud {
  id: number;
  monto: number;
  plazoMeses: number;
  cedula: string;
  estado: EstadoSolicitud;
  comentario: string | null;
  fechaCreacion: string;
}

/** Cuerpo de `POST /api/solicitudes`. */
export interface CrearSolicitudPayload {
  monto: number;
  plazoMeses: number;
  cedula: string;
}

/** Cuerpo de `PATCH /api/solicitudes/{id}/estado`. */
export interface CambiarEstadoPayload {
  estado: EstadoSolicitud;
  comentario: string;
}

/** Límites de negocio, en un único sitio para UI y validadores. */
export const REGLAS_SOLICITUD = {
  montoMinimo: 500,
  montoMaximo: 50_000,
  plazoMinimo: 6,
  plazoMaximo: 60,
  comentarioMaximo: 500,
} as const;

export const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};

/** Opciones del desplegable de filtro, en orden de aparición. */
export const OPCIONES_FILTRO: readonly { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todas' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'APROBADA', etiqueta: 'Aprobadas' },
  { valor: 'RECHAZADA', etiqueta: 'Rechazadas' },
];
