import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="card">
      <h1>Página no encontrada</h1>
      <a class="btn btn--primary" routerLink="/">Volver al inicio</a>
    </section>
  `,
})
export class NotFoundPage {}
