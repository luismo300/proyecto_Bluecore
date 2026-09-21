# =====================================================================
# SISTEMA DE GESTIÓN DE SOLICITUDES DE CRÉDITO — PRUEBA TÉCNICA BLUECORE
# =====================================================================

Aplicación web Full Stack desarrollada como solución a la prueba técnica de Bluecore. 
Permite el ciclo completo de gestión de solicitudes de crédito (creación, filtrado 
por estado y aprobación/rechazo), conectada a una base de datos en AWS RDS MySQL.


---
1. TECNOLOGÍAS Y VERSIONES UTILIZADAS
---
- Backend: Java 17+, Spring Boot 4.0.8, Spring Data JPA, Hibernate, Jakarta Validation
- Frontend: Angular (Standalone Components), TypeScript, HTML5, CSS3
- Base de Datos: AWS RDS MySQL (AWS Aurora)
- Control de versiones: Git / GitHub


---
2. REQUISITOS PREVIOS
---
Asegúrate de tener instalado en tu entorno local:
- Java JDK (Versión 17 o superior)
- Maven
- Node.js (Versión 18 o superior) y npm
- Angular CLI


---
3. GUÍA DE CONFIGURACIÓN Y EJECUCIÓN
---

PASO 1: Clonar el Repositorio
-----------------------------
git clone <URL_DE_TU_REPOSITORIO>
cd <nombre-de-la-carpeta-del-proyecto>


PASO 2: Configurar y Ejecutar el Backend (Spring Boot 4.0.8)
-----------------------------------------------------------
1. Dirígete a la carpeta del proyecto backend.
2. Abre el archivo de propiedades ubicado en:
   `src/main/resources/application.properties`
   
   Asegúrate de que contenga las siguientes credenciales de AWS Aurora:

   spring.application.name=backend
   spring.datasource.url=jdbc:mysql://prueba.cluster-cbyco0wyw688.us-east-1.rds.amazonaws.com:3306/prueba?useSSL=false&serverTimezone=UTC
   spring.datasource.username=Test1
   spring.datasource.password=Bluecore

   spring.jpa.hibernate.ddl-auto=update
   spring.jpa.show-sql=true
   spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

3. Ejecuta el backend mediante Maven desde tu terminal:
   `mvn clean spring-boot:run`
   
   (El servidor se iniciará automáticamente en el puerto: http://localhost:8080)


PASO 3: Configurar y Ejecutar el Frontend (Angular)
--------------------------------------------------
1. Abre una NUEVA terminal y navega hasta la carpeta del frontend.
2. Instala las dependencias necesarias ejecutando:
   `npm install`
3. Inicia la aplicación de desarrollo de Angular:
   `ng serve`
4. Abre tu navegador web de preferencia e ingresa a:
   `http://localhost:4200`


---
4. DECISIONES DE DISEÑO Y VALIDACIONES DE NEGOCIO
---
- Validaciones en Backend: Restricciones estrictas mediante anotaciones en DTOs y entidades:
  * Monto: Mínimo de $500 y máximo de $50,000.
  * Plazo: Rango permitido entre 6 y 60 meses.
  * Cédula y Estado: Obligatorios en el registro y control de cambios.
- API RESTful Coherente:
  * POST /api/solicitudes -> Creación de nuevas solicitudes (Código 201 Created).
  * GET /api/solicitudes -> Listado general con soporte de filtrado opcional por estado.
  * PATCH /api/solicitudes/{id}/estado -> Actualización dinámica del estado con persistencia en AWS.
- Manejo de Errores: Respuestas claras ante fallos de validación o recursos no encontrados (400 Bad Request, 404 Not Found).
