import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideShopCore } from '@shop/shared';
import { routes } from './app.routes';

// Zoneless y OnPush son el default en v22: no hay zone.js ni provideZoneChangeDetection().
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideShopCore(),
  ],
};
