# BlueCore — Gestión de Solicitudes de Crédito

Aplicación full stack para registrar solicitudes de crédito y gestionar su ciclo de
aprobación (pendiente → aprobada / rechazada, siempre con un comentario que justifique
la decisión).

- **Frontend:** Angular 22 (standalone + signals + SSR sobre Express)
- **Backend:** Spring Boot 4 (Java 17) + Spring Data JPA
- **Base de datos:** PostgreSQL 16 en AWS Aurora

---

## Requisitos previos

| Herramienta | Versión mínima | Comprobar con |
|---|---|---|
| Node.js | 20 (probado en 22) | `node -v` |
| npm | 10 | `npm -v` |
| JDK | 17 | `java -version` |

Maven **no** hace falta: el repositorio incluye el wrapper (`backend/mvnw`).

---

## Arranque rápido

Hacen falta **dos terminales**, una por servicio.

### 1. Backend — http://localhost:8080

```bash
cd backend
./mvnw spring-boot:run
```

Queda listo cuando aparece `Started BackendApplication`. Comprobación rápida:

```bash
curl http://localhost:8080/api/solicitudes
```

### 2. Frontend — http://localhost:4200

```bash
cd frontend
npm install
npm start
```

Abre http://localhost:4200. El frontend apunta al backend mediante
`frontend/src/environments/environment.ts`.

> El backend solo acepta peticiones desde `http://localhost:4200` (CORS). Si cambias el
> puerto del frontend, actualiza `@CrossOrigin` en `SolicitudController`.

---

## Configuración de la base de datos

Las credenciales viven en `backend/src/main/resources/application.properties`. Se pueden
sobrescribir por variables de entorno sin tocar el archivo:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<bd> \
SPRING_DATASOURCE_USERNAME=<usuario> \
SPRING_DATASOURCE_PASSWORD=<contraseña> \
./mvnw spring-boot:run
```

Hibernate crea o actualiza el esquema al arrancar (`spring.jpa.hibernate.ddl-auto=update`),
así que no hay que ejecutar migraciones a mano.

---

## Verificación

```bash
cd frontend
npm run lint          # ESLint (TypeScript + plantillas Angular)
npm run format:check  # Prettier
npm test              # Vitest
npm run build         # build de producción + prerender SSR
```

Backend:

```bash
cd backend
./mvnw test
```

---

## API

Base: `http://localhost:8080/api/solicitudes`

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| `GET` | `/` | — | Lista todas las solicitudes |
| `GET` | `/?estado=PENDIENTE` | — | Filtra por estado (`PENDIENTE`, `APROBADA`, `RECHAZADA`) |
| `POST` | `/` | `{ monto, plazoMeses, cedula }` | Crea una solicitud (nace en `PENDIENTE`) |
| `PATCH` | `/{id}/estado` | `{ estado, comentario }` | Cambia el estado; el comentario es obligatorio |

### Reglas de negocio

- **Monto:** entre $500 y $50 000
- **Plazo:** entre 6 y 60 meses
- **Cédula:** obligatoria
- **Cambio de estado:** exige comentario (máx. 500 caracteres)

Los errores de validación devuelven `400` con el detalle por campo:

```json
{
  "status": 400,
  "message": "La solicitud contiene datos inválidos",
  "errors": { "monto": "El monto mínimo permitido es $500" }
}
```

---

## Estructura

```
backend/
  src/main/java/com/bluecore/backend/
    controller/   # Endpoints REST
    dto/          # Contratos de entrada
    model/        # Entidades JPA
    repository/   # Acceso a datos
    exception/    # Manejo centralizado de errores
frontend/
  src/app/
    core/         # Interceptor HTTP y utilidades transversales
    solicitudes/  # Feature: modelos, servicio, páginas y componentes de UI
    styles.css    # Tokens de diseño (colores, tipografía, espaciado)
```
