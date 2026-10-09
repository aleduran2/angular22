import { Routes } from '@angular/router';
import { authGuard } from '@shop/shared';
import { CartPage } from './cart/cart.page';

// Punto de entrada que el remote expone al shell (ver federation.config.mjs).
export const routes: Routes = [
  { path: '', component: CartPage, title: 'Carrito' },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./checkout/checkout.page').then((m) => m.CheckoutPage),
    title: 'Finalizar compra',
  },
  {
    path: 'pedido/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./orders/order.page').then((m) => m.OrderPage),
    title: 'Pedido confirmado',
  },
];
