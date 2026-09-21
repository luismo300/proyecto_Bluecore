import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';
import { ApiError, esApiError } from '../../../core/api-error';
import {
  EstadoSolicitud,
  FiltroEstado,
  OPCIONES_FILTRO,
  Solicitud,
} from '../../models/solicitud.model';
import { SolicitudesService } from '../../services/solicitudes.service';
import { ConfirmarEstadoDialog } from '../../ui/confirmar-estado-dialog/confirmar-estado-dialog';
import { EstadoBadge } from '../../ui/estado-badge/estado-badge';
import { formatearFecha, formatearMoneda } from '../../utils/formato';

/** Solicitud sobre la que se está decidiendo en el diálogo. */
interface DecisionPendiente {
  solicitud: Solicitud;
  destino: EstadoSolicitud;
}

@Component({
  selector: 'app-solicitudes-lista',
  standalone: true,
  imports: [EstadoBadge, ConfirmarEstadoDialog],
  templateUrl: './solicitudes-lista.html',
  styleUrl: './solicitudes-lista.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudesLista {
  private readonly servicio = inject(SolicitudesService);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** Cambia cuando el formulario crea una solicitud: fuerza una recarga. */
  readonly revision = input(0);

  readonly opcionesFiltro = OPCIONES_FILTRO;
  readonly filtro = signal<FiltroEstado>('TODOS');

  readonly solicitudes = signal<Solicitud[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly decision = signal<DecisionPendiente | null>(null);
  readonly guardando = signal(false);
  readonly errorDialogo = signal<string | null>(null);
  readonly ultimoCambio = signal<string | null>(null);

  /** Recarga manual tras un error, sin tocar el filtro. */
  private readonly reintentos = signal(0);

  readonly hayFiltroActivo = computed(() => this.filtro() !== 'TODOS');

  readonly etiquetaFiltro = computed(
    () => OPCIONES_FILTRO.find((opcion) => opcion.valor === this.filtro())?.etiqueta ?? 'Todas',
  );

  protected readonly formatearMoneda = formatearMoneda;
  protected readonly formatearFecha = formatearFecha;

  constructor() {
    const criterio = computed(() => ({
      estado: this.filtro(),
      revision: this.revision(),
      reintento: this.reintentos(),
    }));

    toObservable(criterio)
      .pipe(
        debounceTime(200),
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap(({ estado }) => {
          // En SSR no se contacta con la API: el prerender no debe depender del
          // backend y la carga real ocurre tras la hidratación.
          if (!this.esNavegador) {
            return of({ ok: true as const, datos: [] as Solicitud[] });
          }
          return this.servicio.listar(estado).pipe(
            map((datos) => ({ ok: true as const, datos })),
            catchError((fallo: unknown) =>
              of({ ok: false as const, mensaje: this.mensajeDe(fallo) }),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((resultado) => {
        if (resultado.ok) {
          this.solicitudes.set(resultado.datos);
        } else {
          this.solicitudes.set([]);
          this.error.set(resultado.mensaje);
        }
        this.cargando.set(this.esNavegador ? false : true);
      });
  }

  cambiarFiltro(valor: string): void {
    this.filtro.set(valor as FiltroEstado);
  }

  reintentar(): void {
    this.reintentos.update((valor) => valor + 1);
  }

  limpiarFiltro(): void {
    this.filtro.set('TODOS');
  }

  abrirDecision(solicitud: Solicitud, destino: EstadoSolicitud): void {
    this.errorDialogo.set(null);
    this.ultimoCambio.set(null);
    this.decision.set({ solicitud, destino });
  }

  cerrarDecision(): void {
    if (this.guardando()) return;
    this.decision.set(null);
    this.errorDialogo.set(null);
    this.devolverFoco();
  }

  confirmarDecision(comentario: string): void {
    const pendiente = this.decision();
    if (!pendiente) return;

    this.guardando.set(true);
    this.errorDialogo.set(null);

    this.servicio
      .cambiarEstado(pendiente.solicitud.id, { estado: pendiente.destino, comentario })
      .subscribe({
        next: (actualizada) => {
          this.guardando.set(false);
          this.decision.set(null);
          this.aplicarCambio(actualizada);
          this.ultimoCambio.set(
            `La solicitud N.º ${actualizada.id} pasó a ${actualizada.estado.toLowerCase()}.`,
          );
          this.devolverFoco();
        },
        error: (fallo: unknown) => {
          this.guardando.set(false);
          this.errorDialogo.set(this.mensajeDe(fallo));
        },
      });
  }

  /**
   * Refleja el cambio sin volver a pedir la lista. Si hay un filtro activo y la
   * solicitud deja de cumplirlo, desaparece de la vista.
   */
  private aplicarCambio(actualizada: Solicitud): void {
    const filtro = this.filtro();
    this.solicitudes.update((actuales) => {
      const siguientes = actuales.map((s) => (s.id === actualizada.id ? actualizada : s));
      return filtro === 'TODOS' ? siguientes : siguientes.filter((s) => s.estado === filtro);
    });
  }

  /** Devuelve el foco al cuerpo de la tabla tras cerrar el diálogo. */
  private devolverFoco(): void {
    if (!this.esNavegador) return;
    queueMicrotask(() => {
      const objetivo = document.getElementById('filtro-estado');
      objetivo?.focus();
    });
  }

  private mensajeDe(fallo: unknown): string {
    if (esApiError(fallo)) {
      const apiError = fallo as ApiError;
      const porCampo = Object.values(apiError.errors);
      return porCampo.length ? porCampo.join(' ') : apiError.message;
    }
    return 'Ocurrió un error inesperado al comunicarse con el servidor.';
  }
}
