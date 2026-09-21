import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CambiarEstadoPayload,
  CrearSolicitudPayload,
  FiltroEstado,
  Solicitud,
} from '../models/solicitud.model';

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/solicitudes`;

  /**
   * Lista las solicitudes. El filtrado se delega al backend (`?estado=`) en lugar
   * de traer todo y recortar en cliente.
   */
  listar(estado: FiltroEstado = 'TODOS'): Observable<Solicitud[]> {
    const params = estado === 'TODOS' ? undefined : new HttpParams().set('estado', estado);
    return this.http.get<Solicitud[]>(this.apiUrl, { params });
  }

  crear(payload: CrearSolicitudPayload): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.apiUrl, payload);
  }

  cambiarEstado(id: number, payload: CambiarEstadoPayload): Observable<Solicitud> {
    return this.http.patch<Solicitud>(`${this.apiUrl}/${id}/estado`, payload);
  }
}
