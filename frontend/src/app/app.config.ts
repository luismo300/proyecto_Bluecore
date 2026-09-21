import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // withFetch() evita que el bundle de servidor arrastre el shim xhr2 en SSR.
    provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor])),
  ],
};
