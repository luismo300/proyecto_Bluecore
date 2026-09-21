import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError, esApiError } from '../../../core/api-error';
import { REGLAS_SOLICITUD, Solicitud } from '../../models/solicitud.model';
import { SolicitudesService } from '../../services/solicitudes.service';
import {
  formatearMiles,
  formatearMoneda,
  formatearMonedaCompacta,
  normalizarCedula,
  parsearMonto,
} from '../../utils/formato';
import { validadorCedula, validadorMonto } from '../../utils/validadores';

@Component({
  selector: 'app-solicitud-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './solicitud-form.html',
  styleUrl: './solicitud-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudForm {
  private readonly fb = inject(FormBuilder);
  private readonly solicitudes = inject(SolicitudesService);

  /** Avisa al contenedor para que refresque el listado. */
  readonly creada = output<Solicitud>();
  /** El usuario pide ir al listado desde el panel de confirmación. */
  readonly verListado = output<void>();

  readonly reglas = REGLAS_SOLICITUD;
  readonly plazosSugeridos = [12, 24, 36, 48, 60];

  readonly enviando = signal(false);
  readonly solicitudCreada = signal<Solicitud | null>(null);
  readonly errorGeneral = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    cedula: ['', [validadorCedula]],
    monto: ['', [validadorMonto]],
    plazoMeses: [
      null as number | null,
      [
        Validators.required,
        Validators.min(REGLAS_SOLICITUD.plazoMinimo),
        Validators.max(REGLAS_SOLICITUD.plazoMaximo),
      ],
    ],
  });

  get cedula(): FormControl<string> {
    return this.formulario.controls.cedula;
  }
  get monto(): FormControl<string> {
    return this.formulario.controls.monto;
  }
  get plazoMeses(): FormControl<number | null> {
    return this.formulario.controls.plazoMeses;
  }

  /** Muestra el error solo cuando el usuario ya interactuó con el campo. */
  debeMostrarError(control: FormControl<unknown>): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  /** Separador de miles en vivo, respetando la posición lógica del cursor. */
  alEscribirMonto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const formateado = formatearMiles(input.value);
    input.value = formateado;
    this.monto.setValue(formateado, { emitEvent: false });
  }

  alEscribirCedula(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const normalizado = normalizarCedula(input.value);
    input.value = normalizado;
    this.cedula.setValue(normalizado, { emitEvent: false });
  }

  elegirPlazo(meses: number): void {
    this.plazoMeses.setValue(meses);
    this.plazoMeses.markAsDirty();
  }

  /** Vista previa del monto ya normalizado, para confirmar lo que se enviará. */
  montoPrevisto(): string | null {
    const valor = parsearMonto(this.monto.value);
    return valor === null ? null : formatearMoneda(valor);
  }

  enviar(): void {
    this.errorGeneral.set(null);
    this.solicitudCreada.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const monto = parsearMonto(this.monto.value);
    const plazo = this.plazoMeses.value;
    if (monto === null || plazo === null) return;

    this.enviando.set(true);
    this.formulario.disable({ emitEvent: false });

    this.solicitudes
      .crear({ monto, plazoMeses: plazo, cedula: this.cedula.value.trim() })
      .subscribe({
        next: (solicitud) => {
          this.enviando.set(false);
          this.formulario.enable({ emitEvent: false });
          this.formulario.reset({ cedula: '', monto: '', plazoMeses: null });
          this.solicitudCreada.set(solicitud);
          this.creada.emit(solicitud);
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.formulario.enable({ emitEvent: false });
          this.mostrarErrorDelBackend(error);
        },
      });
  }

  cerrarConfirmacion(): void {
    this.solicitudCreada.set(null);
  }

  /**
   * Coloca cada mensaje de la API en su campo. Si el backend señala un campo que
   * aquí no existe, el texto se conserva en el aviso general en lugar de perderse.
   */
  private mostrarErrorDelBackend(error: unknown): void {
    if (!esApiError(error)) {
      this.errorGeneral.set('Ocurrió un error inesperado al crear la solicitud.');
      return;
    }

    const apiError = error as ApiError;
    const sinUbicar: string[] = [];

    for (const [campo, mensaje] of Object.entries(apiError.errors)) {
      const control = this.formulario.get(campo);
      if (control) {
        control.setErrors({ ...(control.errors ?? {}), backend: mensaje });
        control.markAsTouched();
      } else {
        sinUbicar.push(mensaje);
      }
    }

    this.errorGeneral.set(sinUbicar.length ? sinUbicar.join(' ') : apiError.message);
  }

  /** Mensaje enviado por el backend para un campo concreto, si lo hay. */
  errorDelBackend(control: FormControl<unknown>): string | null {
    const mensaje = control.errors?.['backend'];
    return typeof mensaje === 'string' ? mensaje : null;
  }

  formatearMoneda = formatearMoneda;
  formatearMonedaCompacta = formatearMonedaCompacta;
}
