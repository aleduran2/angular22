import { Routes } from '@angular/router';
import { LoginPage } from '@shop/shared';
import { routes as catalogoRoutes } from './catalogo.routes';

// Rutas del remote corriendo solo (ng serve catalogo). Usa el mismo prefijo que el shell
// para que los links relativos y absolutos funcionen igual en los dos modos.
export const routes: Routes = [
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
  { path: 'catalogo', children: catalogoRoutes },
  { path: 'login', component: LoginPage, title: 'Iniciar sesión' },
  { path: '**', redirectTo: 'catalogo' },
];
