import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { httpErrorInterceptor } from '../../../core/http-error.interceptor';
import { Solicitud } from '../../models/solicitud.model';
import { SolicitudesLista } from './solicitudes-lista';

const URL_SOLICITUDES = `${environment.apiUrl}/solicitudes`;

function solicitud(parcial: Partial<Solicitud> = {}): Solicitud {
  return {
    id: 1,
    monto: 5000,
    plazoMeses: 24,
    cedula: '8-123-4567',
    estado: 'PENDIENTE',
    comentario: null,
    fechaCreacion: '2026-09-20T10:00:00',
    ...parcial,
  };
}

describe('SolicitudesLista', () => {
  let fixture: ComponentFixture<SolicitudesLista>;
  let componente: SolicitudesLista;
  let httpMock: HttpTestingController;

  /** Dispara el efecto de toObservable y agota el debounce del filtro. */
  function avanzarFiltro(): void {
    fixture.detectChanges();
    vi.advanceTimersByTime(250);
  }

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [SolicitudesLista],
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitudesLista);
    componente = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('pide todas las solicitudes al iniciarse, sin parámetro de estado', () => {
    avanzarFiltro();

    const peticion = httpMock.expectOne(URL_SOLICITUDES);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.has('estado')).toBe(false);
    expect(componente.cargando()).toBe(true);

    peticion.flush([solicitud()]);

    expect(componente.cargando()).toBe(false);
    expect(componente.solicitudes().length).toBe(1);
  });

  it('delega el filtro al backend en lugar de recortar en el cliente', () => {
    avanzarFiltro();
    httpMock
      .expectOne(URL_SOLICITUDES)
      .flush([solicitud(), solicitud({ id: 2, estado: 'APROBADA' })]);

    componente.cambiarFiltro('APROBADA');
    avanzarFiltro();

    const peticion = httpMock.expectOne(
      (req) => req.url === URL_SOLICITUDES && req.params.get('estado') === 'APROBADA',
    );
    peticion.flush([solicitud({ id: 2, estado: 'APROBADA' })]);

    expect(componente.solicitudes().map((s) => s.id)).toEqual([2]);
    expect(componente.hayFiltroActivo()).toBe(true);
  });

  it('descarta la respuesta anterior si el filtro cambia antes de que llegue', () => {
    avanzarFiltro();
    httpMock.expectOne(URL_SOLICITUDES).flush([]);

    componente.cambiarFiltro('APROBADA');
    avanzarFiltro();
    const primera = httpMock.expectOne((req) => req.params.get('estado') === 'APROBADA');

    componente.cambiarFiltro('RECHAZADA');
    avanzarFiltro();
    const segunda = httpMock.expectOne((req) => req.params.get('estado') === 'RECHAZADA');

    // switchMap cancela la suscripción anterior: la primera petición se aborta
    // en lugar de llegar tarde y pisar el resultado vigente.
    expect(primera.cancelled).toBe(true);

    segunda.flush([solicitud({ id: 3, estado: 'RECHAZADA' })]);

    expect(componente.solicitudes().map((s) => s.id)).toEqual([3]);
  });

  it('distingue el vacío por filtro del vacío absoluto', () => {
    componente.cambiarFiltro('RECHAZADA');
    avanzarFiltro();
    httpMock.expectOne((req) => req.params.get('estado') === 'RECHAZADA').flush([]);

    expect(componente.solicitudes()).toEqual([]);
    expect(componente.hayFiltroActivo()).toBe(true);
    expect(componente.etiquetaFiltro()).toBe('Rechazadas');
  });

  it('expone el mensaje de la API al fallar y permite reintentar', () => {
    avanzarFiltro();
    httpMock
      .expectOne(URL_SOLICITUDES)
      .flush(
        { status: 500, message: 'La base de datos no responde' },
        { status: 500, statusText: 'Server Error' },
      );

    expect(componente.error()).toBe('La base de datos no responde');
    expect(componente.cargando()).toBe(false);

    componente.reintentar();
    avanzarFiltro();
    httpMock.expectOne(URL_SOLICITUDES).flush([solicitud()]);

    expect(componente.error()).toBeNull();
    expect(componente.solicitudes().length).toBe(1);
  });

  it('envía el comentario junto al nuevo estado', () => {
    avanzarFiltro();
    httpMock.expectOne(URL_SOLICITUDES).flush([solicitud()]);

    componente.abrirDecision(solicitud(), 'APROBADA');
    componente.confirmarDecision('Ingresos verificados');

    const peticion = httpMock.expectOne(`${URL_SOLICITUDES}/1/estado`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({
      estado: 'APROBADA',
      comentario: 'Ingresos verificados',
    });

    peticion.flush(solicitud({ estado: 'APROBADA', comentario: 'Ingresos verificados' }));

    expect(componente.decision()).toBeNull();
    expect(componente.solicitudes()[0].estado).toBe('APROBADA');
    expect(componente.ultimoCambio()).toContain('N.º 1');
  });

  it('mantiene el diálogo abierto y muestra el motivo si el backend rechaza el cambio', () => {
    avanzarFiltro();
    httpMock.expectOne(URL_SOLICITUDES).flush([solicitud()]);

    componente.abrirDecision(solicitud(), 'RECHAZADA');
    componente.confirmarDecision('   ');

    httpMock.expectOne(`${URL_SOLICITUDES}/1/estado`).flush(
      {
        status: 400,
        message: 'La solicitud contiene datos inválidos',
        errors: { comentario: 'El comentario es obligatorio para cambiar el estado' },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(componente.decision()).not.toBeNull();
    expect(componente.errorDialogo()).toBe('El comentario es obligatorio para cambiar el estado');
    expect(componente.guardando()).toBe(false);
  });
});
