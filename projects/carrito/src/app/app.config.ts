import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideShopCore } from '@shop/shared';
import { routes } from './app.routes';

// Solo aplica cuando el remote corre standalone. Dentro del shell manda el app.config del shell.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideShopCore(),
  ],
};
