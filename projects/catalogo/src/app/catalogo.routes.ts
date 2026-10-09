import { Routes } from '@angular/router';
import { ProductListPage } from './products/product-list.page';

// Punto de entrada que el remote expone al shell (ver federation.config.mjs).
export const routes: Routes = [
  { path: '', component: ProductListPage, title: 'Catálogo' },
  {
    path: ':id',
    loadComponent: () => import('./products/product-detail.page').then((m) => m.ProductDetailPage),
    title: 'Detalle de producto',
  },
];
