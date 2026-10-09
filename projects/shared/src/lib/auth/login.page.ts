import { Component, inject, input, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { FieldError } from '../ui/field-error';
import { AuthService } from './auth.service';

interface Credentials {
  email: string;
  password: string;
}

@Component({
  selector: 'shop-login-page',
  imports: [FormField, FormRoot, FieldError],
  template: `
    <section class="card card--narrow">
      <h1>Iniciar sesión</h1>
      <p class="muted">Demo: cualquier email y la contraseña <code>angular22</code>.</p>

      <form class="form" [formRoot]="loginForm">
        <label>
          Email
          <input type="email" autocomplete="username" [formField]="loginForm.email" />
        </label>
        <shop-field-error [state]="loginForm.email()" />

        <label>
          Contraseña
          <input type="password" autocomplete="current-password" [formField]="loginForm.password" />
        </label>
        <shop-field-error [state]="loginForm.password()" />

        @if (serverError(); as message) {
          <p class="alert alert--error" role="alert">{{ message }}</p>
        }

        <button type="submit" class="btn btn--primary" [disabled]="loginForm().submitting()">
          {{ loginForm().submitting() ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Llega del query param ?returnUrl= gracias a withComponentInputBinding().
  readonly returnUrl = input<string>();

  protected readonly serverError = signal<string | null>(null);
  private readonly credentials = signal<Credentials>({ email: '', password: '' });

  protected readonly loginForm = form(
    this.credentials,
    (path) => {
      required(path.email, { message: 'Ingresá tu email' });
      email(path.email, { message: 'El email no es válido' });
      required(path.password, { message: 'Ingresá tu contraseña' });
    },
    { submission: { action: () => this.login() } },
  );

  // FormRoot solo ejecuta la action si el formulario es válido.
  private async login(): Promise<void> {
    this.serverError.set(null);
    const { email, password } = this.credentials();
    try {
      await this.auth.login(email, password);
      await this.router.navigateByUrl(this.returnUrl() ?? '/');
    } catch (error) {
      this.serverError.set(apiErrorMessage(error));
    }
  }
}
