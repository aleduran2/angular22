import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService, ToastOutlet } from '@shop/shared';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastOutlet],
  template: `
    <header class="standalone-bar">
      <strong>carrito</strong> corriendo standalone
      <span>{{ auth.user()?.email ?? 'Sin sesión' }}</span>
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
  protected readonly auth = inject(AuthService);
}
