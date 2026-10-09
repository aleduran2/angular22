import { Routes } from '@angular/router';
import { LoginPage } from '@shop/shared';
import { remoteRoutes } from './federation/remote-loader';
import { HomePage } from './pages/home.page';

export const routes: Routes = [
  { path: '', component: HomePage, pathMatch: 'full', title: 'NG22 Shop' },
  { path: 'catalogo', loadChildren: remoteRoutes('catalogo') },
  { path: 'carrito', loadChildren: remoteRoutes('carrito') },
  { path: 'login', component: LoginPage, title: 'Iniciar sesión' },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPage),
    title: 'Página no encontrada',
  },
];
