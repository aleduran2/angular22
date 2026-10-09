import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { authInterceptor } from '../auth/auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { API_URL } from './tokens';

export interface ShopCoreOptions {
  apiUrl?: string;
}

// Lo llama cada app en su app.config. Dentro del shell solo vale la config del shell:
// el app.config de un remote se usa únicamente cuando ese remote corre standalone.
export function provideShopCore(options: ShopCoreOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    options.apiUrl ? [{ provide: API_URL, useValue: options.apiUrl }] : [],
  ]);
}
