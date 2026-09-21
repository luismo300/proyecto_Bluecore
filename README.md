# Sistema de Gestión de Solicitudes de Crédito — Prueba Técnica Bluecore

Aplicación web Full Stack desarrollada como solución a la prueba técnica de Bluecore.
Permite el ciclo completo de gestión de solicitudes de crédito (creación, filtrado
por estado y aprobación/rechazo con comentario obligatorio), conectada a una base de
datos PostgreSQL en AWS Aurora.

---

1. TECNOLOGÍAS Y VERSIONES UTILIZADAS

---

- Backend: Java 17, Spring Boot 4.0.8, Spring Data JPA, Hibernate 7, Jakarta Validation
- Frontend: Angular 22 (Standalone Components + Signals + SSR), TypeScript, CSS3
- Base de Datos: PostgreSQL 16 en AWS Aurora
- Pruebas y calidad: Vitest, ESLint (angular-eslint), Prettier
- Contenedores: Docker + Docker Compose
- Control de versiones: Git / GitHub

---

2. REQUISITOS PREVIOS

---

Para la ejecución local:

- Java JDK 17 o superior
- Node.js 20 o superior y npm (probado en Node 22)

Maven NO es necesario: el repositorio incluye el wrapper (`backend/mvnw`).
Angular CLI tampoco: se invoca a través de los scripts de npm.

Para la ejecución con contenedores basta con Docker y Docker Compose.

---

3. GUÍA DE CONFIGURACIÓN Y EJECUCIÓN

---

## PASO 1: Clonar el Repositorio

    git clone <https://github.com/luismo300/proyecto_Bluecore.git>
    cd proyecto_Bluecore

## PASO 2: Configurar y Ejecutar el Backend (Spring Boot 4.0.8)

1.  Las credenciales de AWS Aurora ya están configuradas en:
    `backend/src/main/resources/application.properties`

    Los parámetros relevantes son la URL JDBC de PostgreSQL, el usuario, la
    contraseña y `spring.jpa.hibernate.ddl-auto=update`, que deja a Hibernate
    crear o actualizar las tablas al arrancar.

    Para usar otro clúster sin editar el archivo, basta con exportar las
    variables de entorno, que Spring Boot antepone a las propiedades:

        SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<base> \
        SPRING_DATASOURCE_USERNAME=<usuario> \
        SPRING_DATASOURCE_PASSWORD=<contraseña> \
        ./mvnw spring-boot:run

2.  Ejecuta el backend desde la carpeta `backend`:

        ./mvnw spring-boot:run

    El servidor queda listo cuando aparece `Started BackendApplication`, en
    http://localhost:8080

## PASO 3: Configurar y Ejecutar el Frontend (Angular 22)

1. Abre una NUEVA terminal y navega hasta la carpeta `frontend`.
2. Instala las dependencias:

   npm install

3. Inicia la aplicación:

   npm start

4. Abre el navegador en http://localhost:4200

   El backend solo acepta peticiones desde ese origen (CORS). Si cambias el
   puerto, actualiza `@CrossOrigin` en `SolicitudController`.

---

4. EJECUCIÓN CON DOCKER

---

Alternativa al arranque manual: un solo comando levanta la API y el frontend.
No incluye motor de base de datos, la persistencia sigue en el clúster de Aurora.

    docker compose up --build

| Servicio       | URL                   | Contenedor          |
| -------------- | --------------------- | ------------------- |
| Frontend (SSR) | http://localhost:4200 | `bluecore-frontend` |
| Backend (API)  | http://localhost:8080 | `bluecore-backend`  |

    docker compose logs -f backend   # seguir el log de la API
    docker compose down              # parar ambos servicios

Por defecto se usan las credenciales incluidas en la imagen. Para inyectarlas
desde fuera, copia `.env.example` a `.env` y rellénalo; el archivo es opcional
y está excluido de Git.

Nota: el contenedor sale a internet por la IP del host, así que el grupo de
seguridad de Aurora debe autorizar esa IP. Si Aurora no responde, el backend no
arranca, porque el pool de conexiones falla durante el inicio.

---

5. DECISIONES DE DISEÑO Y VALIDACIONES DE NEGOCIO

---

- Validaciones en Backend: restricciones estrictas mediante anotaciones en DTOs y entidades:
  - Monto: mínimo de $500 y máximo de $50,000.
  - Plazo: rango permitido entre 6 y 60 meses.
  - Cédula: obligatoria en el registro.
  - Comentario: obligatorio en todo cambio de estado, máximo 500 caracteres,
    de modo que cada aprobación o rechazo quede justificado.

- API RESTful coherente:
  - `POST /api/solicitudes` -> creación de nuevas solicitudes (201 Created).
    Cuerpo: `{ monto, plazoMeses, cedula }`. Nace en estado PENDIENTE.
  - `GET /api/solicitudes` -> listado general, con filtrado opcional por estado
    mediante `?estado=PENDIENTE|APROBADA|RECHAZADA`.
  - `PATCH /api/solicitudes/{id}/estado` -> actualización del estado con
    persistencia en AWS. Cuerpo: `{ estado, comentario }`.

- Manejo de errores: un `@RestControllerAdvice` traduce los fallos de validación
  a un cuerpo JSON con el detalle por campo, en lugar del "Bad Request" genérico
  que devuelve Spring Boot por defecto:

        {
          "status": 400,
          "message": "La solicitud contiene datos inválidos",
          "errors": { "monto": "El monto mínimo permitido es $500" }
        }

  Se responde 404 Not Found al intentar cambiar el estado de una solicitud
  inexistente.

- Frontend: el filtro se delega al backend mediante RxJS (`debounceTime` +
  `switchMap`), de forma que una selección rápida cancela la petición anterior.
  Los estados de carga, error, lista vacía por filtro y lista vacía absoluta se
  distinguen entre sí. La interfaz cumple WCAG 2.2 AA y es utilizable en móvil,
  donde la tabla se apila en tarjetas.

---

6. VERIFICACIÓN

---

Frontend (desde la carpeta `frontend`):

    npm run lint           # ESLint sobre TypeScript y plantillas
    npm run format:check   # Prettier
    npm test               # Vitest (24 pruebas)
    npm run build          # build de producción + prerender SSR

Backend (desde la carpeta `backend`):

    ./mvnw test

---

7. ESTRUCTURA DEL PROYECTO

---

    backend/
      Dockerfile            # imagen multi-etapa (Maven -> JRE)
      src/main/java/com/bluecore/backend/
        controller/         # endpoints REST
        dto/                # contratos de entrada
        model/              # entidades JPA
        repository/         # acceso a datos
        exception/          # manejo centralizado de errores
    frontend/
      Dockerfile            # imagen multi-etapa (build Angular -> Node SSR)
      src/
        styles.css          # tokens de diseño (color, tipografía, espaciado)
        app/
          core/             # interceptor HTTP y utilidades transversales
          solicitudes/      # feature: modelos, servicio, páginas y componentes
    docker-compose.yml      # orquestación de ambos servicios
    .env.example            # plantilla para credenciales externas
