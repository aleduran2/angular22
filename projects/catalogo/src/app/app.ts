import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartService, ToastOutlet } from '@shop/shared';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastOutlet],
  template: `
    <header class="standalone-bar">
      <strong>catalogo</strong> corriendo standalone
      <span>Carrito: {{ cart.count() }}</span>
    </header>
    <main class="container">
      <router-outlet />
    </main>
    <shop-toast-outlet />
  `,
  styles: `
    .standalone-bar {
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      background: var(--text);
      color: var(--surface);
    }
  `,
})
export class App {
  protected readonly cart = inject(CartService);
}
