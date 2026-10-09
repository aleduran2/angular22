import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, CartService, ToastOutlet } from '@shop/shared';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  // Misma instancia que usan los remotes: el contador refleja lo que agrega `catalogo`.
  protected readonly cart = inject(CartService);

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
