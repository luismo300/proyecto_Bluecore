import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  ETIQUETA_ESTADO,
  EstadoSolicitud,
  REGLAS_SOLICITUD,
  Solicitud,
} from '../../models/solicitud.model';
import { formatearMoneda } from '../../utils/formato';

/**
 * Diálogo modal que exige un comentario antes de aprobar o rechazar.
 *
 * Implementa el contrato de accesibilidad a mano (aria-modal, foco inicial,
 * trampa de foco y cierre con Escape) para no añadir una dependencia de UI.
 */
@Component({
  selector: 'app-confirmar-estado-dialog',
  standalone: true,
  templateUrl: './confirmar-estado-dialog.html',
  styleUrl: './confirmar-estado-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'alPulsarTecla($event)',
  },
})
export class ConfirmarEstadoDialog implements AfterViewInit {
  readonly solicitud = input.required<Solicitud>();
  readonly estadoDestino = input.required<EstadoSolicitud>();
  readonly enviando = input(false);
  readonly errorMensaje = input<string | null>(null);

  readonly confirmar = output<string>();
  readonly cancelar = output<void>();

  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('contenedor');
  private readonly campoComentario =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('campoComentario');

  protected readonly comentario = signal('');
  protected readonly intentado = signal(false);
  protected readonly maximo = REGLAS_SOLICITUD.comentarioMaximo;

  protected readonly esRechazo = computed(() => this.estadoDestino() === 'RECHAZADA');

  protected readonly titulo = computed(() => {
    const acciones: Record<EstadoSolicitud, string> = {
      APROBADA: 'Aprobar solicitud',
      RECHAZADA: 'Rechazar solicitud',
      PENDIENTE: 'Devolver a pendiente',
    };
    return acciones[this.estadoDestino()];
  });

  protected readonly etiquetaDestino = computed(() => ETIQUETA_ESTADO[this.estadoDestino()]);

  protected readonly comentarioLimpio = computed(() => this.comentario().trim());

  protected readonly errorComentario = computed(() => {
    if (!this.intentado()) return null;
    if (!this.comentarioLimpio()) {
      return 'El comentario es obligatorio para dejar constancia de la decisión.';
    }
    if (this.comentarioLimpio().length > this.maximo) {
      return `El comentario no puede superar los ${this.maximo} caracteres.`;
    }
    return null;
  });

  protected readonly montoFormateado = computed(() => formatearMoneda(this.solicitud().monto));

  ngAfterViewInit(): void {
    this.campoComentario().nativeElement.focus();
  }

  protected alPulsarTecla(evento: KeyboardEvent): void {
    if (evento.key === 'Escape' && !this.enviando()) {
      evento.stopPropagation();
      this.cancelar.emit();
      return;
    }
    if (evento.key === 'Tab') {
      this.atraparFoco(evento);
    }
  }

  /** Mantiene el tabulador dentro del diálogo mientras está abierto. */
  private atraparFoco(evento: KeyboardEvent): void {
    const enfocables = this.contenedor().nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (enfocables.length === 0) return;

    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    const activo = this.contenedor().nativeElement.ownerDocument.activeElement;

    if (evento.shiftKey && activo === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  protected alEscribir(valor: string): void {
    this.comentario.set(valor);
  }

  protected enviar(): void {
    this.intentado.set(true);
    if (this.errorComentario() || this.enviando()) return;
    this.confirmar.emit(this.comentarioLimpio());
  }
}
