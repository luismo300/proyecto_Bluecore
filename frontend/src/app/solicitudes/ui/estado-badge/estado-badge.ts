import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ETIQUETA_ESTADO, EstadoSolicitud } from '../../models/solicitud.model';

/** Etiqueta de color para el estado de una solicitud. Componente presentacional. */
@Component({
  selector: 'app-estado-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="clase()">{{ etiqueta() }}</span>`,
})
export class EstadoBadge {
  readonly estado = input.required<EstadoSolicitud>();

  protected readonly etiqueta = computed(() => ETIQUETA_ESTADO[this.estado()]);
  protected readonly clase = computed(() => `badge badge--${this.estado().toLowerCase()}`);
}
