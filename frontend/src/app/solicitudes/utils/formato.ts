/** Utilidades de formato compartidas por el formulario y el listado. */

/** Convierte "12,500.50" en 12500.5; devuelve null si no hay un número válido. */
export function parsearMonto(valor: string | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const limpio = String(valor).replace(/[^\d.]/g, '');
  if (!limpio || limpio === '.') return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Aplica separador de miles mientras se escribe, conservando como máximo dos
 * decimales y sin descartar el punto recién tecleado ("1000." → "1,000.").
 */
export function formatearMiles(valor: string): string {
  const limpio = valor.replace(/[^\d.]/g, '');
  if (!limpio) return '';

  const [entero, ...resto] = limpio.split('.');
  const enteroFormateado = entero ? Number(entero).toLocaleString('en-US') : '';

  if (resto.length === 0) return enteroFormateado;
  return `${enteroFormateado || '0'}.${resto.join('').slice(0, 2)}`;
}

/** Normaliza la cédula a mayúsculas y descarta caracteres no admitidos. */
export function normalizarCedula(valor: string): string {
  return valor.toUpperCase().replace(/[^0-9A-Z-]/g, '');
}

const FORMATO_MONEDA = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function formatearMoneda(valor: number): string {
  return FORMATO_MONEDA.format(valor);
}

const FORMATO_MONEDA_COMPACTA = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Igual que formatearMoneda, pero sin «.00» en las cantidades redondas. */
export function formatearMonedaCompacta(valor: number): string {
  return FORMATO_MONEDA_COMPACTA.format(valor);
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-PA', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '—' : FORMATO_FECHA.format(fecha);
}
