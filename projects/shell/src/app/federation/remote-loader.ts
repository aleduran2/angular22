import { InjectionToken, inject } from '@angular/core';
import { Routes } from '@angular/router';
import type { NativeFederationResult } from '@angular-architects/native-federation';
import { RemoteErrorPage } from '../pages/remote-error.page';

export type RemoteLoader = NativeFederationResult['loadRemoteModule'];

// main.ts provee acá el loader que devuelve initFederation(). Al ser un token,
// en los tests se reemplaza por un fake sin tocar la red.
export const REMOTE_LOADER = new InjectionToken<RemoteLoader>('REMOTE_LOADER');

// Para usar en loadChildren. Si el remote está caído, la ruta muestra un fallback
// en lugar de romper la navegación de todo el shell.
export function remoteRoutes(remoteName: string): () => Promise<Routes> {
  return async () => {
    const load = inject(REMOTE_LOADER);
    try {
      const module = await load<{ routes: Routes }>(remoteName, './routes');
      return module.routes;
    } catch (error) {
      console.error(`No se pudo cargar el remote "${remoteName}"`, error);
      return [{ path: '**', component: RemoteErrorPage, data: { remoteName } }];
    }
  };
}
