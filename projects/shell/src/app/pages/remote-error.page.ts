import { Component, input } from '@angular/core';

@Component({
  selector: 'app-remote-error-page',
  template: `
    <section class="card" role="alert">
      <h1>Sección no disponible</h1>
      <p>
        No se pudo cargar el microfrontend <strong>{{ remoteName() }}</strong
        >. El resto de la aplicación sigue funcionando.
      </p>
      <p class="muted">
        En desarrollo: verificá que esté corriendo con <code>ng serve {{ remoteName() }}</code> y
        recargá la página.
      </p>
    </section>
  `,
})
export class RemoteErrorPage {
  // Llega desde `data` de la ruta por withComponentInputBinding().
  readonly remoteName = input.required<string>();
}
