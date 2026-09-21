import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { httpErrorInterceptor } from '../../../core/http-error.interceptor';
import { environment } from '../../../../environments/environment';
import { SolicitudForm } from './solicitud-form';

const URL_SOLICITUDES = `${environment.apiUrl}/solicitudes`;

describe('SolicitudForm', () => {
  let fixture: ComponentFixture<SolicitudForm>;
  let componente: SolicitudForm;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudForm],
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitudForm);
    componente = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function rellenar(cedula: string, monto: string, plazoMeses: number | null): void {
    componente.formulario.setValue({ cedula, monto, plazoMeses });
  }

  describe('validación de monto', () => {
    it('exige el monto', () => {
      rellenar('8-123-4567', '', 24);
      expect(componente.monto.errors?.['required']).toBe(true);
    });

    it('rechaza un monto por debajo del mínimo de $500', () => {
      rellenar('8-123-4567', '499', 24);
      expect(componente.monto.errors?.['montoMinimo']).toBe(true);
    });

    it('rechaza un monto por encima del máximo de $50,000', () => {
      rellenar('8-123-4567', '50,001', 24);
      expect(componente.monto.errors?.['montoMaximo']).toBe(true);
    });

    it('acepta los valores límite del rango', () => {
      rellenar('8-123-4567', '500', 24);
      expect(componente.monto.valid).toBe(true);

      rellenar('8-123-4567', '50,000', 24);
      expect(componente.monto.valid).toBe(true);
    });

    it('interpreta el separador de miles como un solo número', () => {
      rellenar('8-123-4567', '12,500.50', 24);
      expect(componente.monto.valid).toBe(true);
      expect(componente.montoPrevisto()).toBe('$12,500.50');
    });
  });

  describe('validación de plazo', () => {
    it('rechaza menos de 6 meses', () => {
      rellenar('8-123-4567', '1,000', 5);
      expect(componente.plazoMeses.errors?.['min']).toBeTruthy();
    });

    it('rechaza más de 60 meses', () => {
      rellenar('8-123-4567', '1,000', 61);
      expect(componente.plazoMeses.errors?.['max']).toBeTruthy();
    });

    it('acepta los valores límite del rango', () => {
      rellenar('8-123-4567', '1,000', 6);
      expect(componente.plazoMeses.valid).toBe(true);

      rellenar('8-123-4567', '1,000', 60);
      expect(componente.plazoMeses.valid).toBe(true);
    });
  });

  describe('validación de cédula', () => {
    it('exige la cédula', () => {
      rellenar('', '1,000', 24);
      expect(componente.cedula.errors?.['required']).toBe(true);
    });

    it('rechaza un formato que no corresponde a una cédula', () => {
      rellenar('81234567', '1,000', 24);
      expect(componente.cedula.errors?.['formatoCedula']).toBe(true);
    });

    it('acepta los formatos habituales', () => {
      for (const cedula of ['8-123-4567', '4-123-456', 'PE-12-345', 'E-8-12345', 'N-20-1234']) {
        rellenar(cedula, '1,000', 24);
        expect(componente.cedula.valid).toBe(true);
      }
    });
  });

  describe('envío', () => {
    it('no llama a la API si el formulario es inválido y marca los campos', () => {
      rellenar('', '10', null);
      componente.enviar();

      expect(componente.cedula.touched).toBe(true);
      expect(componente.enviando()).toBe(false);
      httpMock.expectNone(URL_SOLICITUDES);
    });

    it('envía el monto como número, sin separadores', () => {
      rellenar('8-123-4567', '12,500', 24);
      componente.enviar();

      const peticion = httpMock.expectOne(URL_SOLICITUDES);
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toEqual({
        monto: 12500,
        plazoMeses: 24,
        cedula: '8-123-4567',
      });
      expect(componente.enviando()).toBe(true);

      peticion.flush({
        id: 7,
        monto: 12500,
        plazoMeses: 24,
        cedula: '8-123-4567',
        estado: 'PENDIENTE',
        comentario: null,
        fechaCreacion: '2026-09-20T10:00:00',
      });

      expect(componente.enviando()).toBe(false);
      expect(componente.solicitudCreada()?.id).toBe(7);
      expect(componente.monto.value).toBe('');
    });

    it('coloca cada mensaje del backend en su propio campo', () => {
      rellenar('8-123-4567', '12,500', 24);
      componente.enviar();

      httpMock.expectOne(URL_SOLICITUDES).flush(
        {
          status: 400,
          message: 'La solicitud contiene datos inválidos',
          errors: { monto: 'El monto mínimo permitido es $500' },
        },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(componente.monto.errors?.['backend']).toBe('El monto mínimo permitido es $500');
      expect(componente.errorDelBackend(componente.monto)).toBe(
        'El monto mínimo permitido es $500',
      );
      expect(componente.enviando()).toBe(false);
    });

    it('muestra un mensaje general cuando el backend no responde', () => {
      rellenar('8-123-4567', '12,500', 24);
      componente.enviar();

      httpMock
        .expectOne(URL_SOLICITUDES)
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(componente.errorGeneral()).toContain('No se pudo contactar con el servidor');
    });
  });
});
