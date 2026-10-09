import { Routes } from '@angular/router';
import { LoginPage } from '@shop/shared';
import { routes as carritoRoutes } from './carrito.routes';

// Rutas del remote corriendo solo (ng serve carrito). Usa el mismo prefijo que el shell.
export const routes: Routes = [
  { path: '', redirectTo: 'carrito', pathMatch: 'full' },
  { path: 'carrito', children: carritoRoutes },
  { path: 'login', component: LoginPage, title: 'Iniciar sesión' },
  { path: '**', redirectTo: 'carrito' },
];
