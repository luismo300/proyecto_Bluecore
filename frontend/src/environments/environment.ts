/**
 * Configuración de entorno del frontend.
 *
 * `apiUrl` apunta al backend de Spring Boot. Al desplegar basta con cambiar este
 * valor (o sustituir el archivo mediante `fileReplacements` en angular.json).
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
