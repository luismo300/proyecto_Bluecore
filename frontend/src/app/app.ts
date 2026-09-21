import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SolicitudesLista } from './solicitudes/pages/solicitudes-lista/solicitudes-lista';
import { SolicitudForm } from './solicitudes/pages/solicitud-form/solicitud-form';

type Pantalla = 'formulario' | 'listado';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SolicitudForm, SolicitudesLista],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly pantalla = signal<Pantalla>('formulario');

  /** Se incrementa al crear una solicitud para que el listado vuelva a cargarse. */
  readonly revision = signal(0);

  irA(pantalla: Pantalla): void {
    this.pantalla.set(pantalla);
  }

  alCrearSolicitud(): void {
    this.revision.update((valor) => valor + 1);
  }
}
