import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { REGLAS_SOLICITUD } from '../models/solicitud.model';
import { parsearMonto } from './formato';

/**
 * Valida el monto sobre el texto ya formateado del input (con separadores de
 * miles), replicando los límites que aplica el backend.
 */
export const validadorMonto: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const bruto = control.value;
  if (bruto === null || bruto === undefined || String(bruto).trim() === '') {
    return { required: true };
  }

  const monto = parsearMonto(String(bruto));
  if (monto === null || monto <= 0) return { montoInvalido: true };
  if (monto < REGLAS_SOLICITUD.montoMinimo) return { montoMinimo: true };
  if (monto > REGLAS_SOLICITUD.montoMaximo) return { montoMaximo: true };
  return null;
};

/**
 * Cédula panameña: provincia (1-13) o prefijo especial (PE, E, N, AV),
 * seguida de tomo y asiento. Ej.: 8-123-4567, PE-12-345, E-8-12345.
 */
export const PATRON_CEDULA = /^(?:1[0-3]|[1-9]|PE|E|N|AV)-\d{1,4}-\d{1,6}$/;

export const validadorCedula: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = String(control.value ?? '').trim();
  if (!valor) return { required: true };
  return PATRON_CEDULA.test(valor) ? null : { formatoCedula: true };
};
