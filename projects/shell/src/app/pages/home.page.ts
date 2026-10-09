import { httpResource } from '@angular/common/http';
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <section class="card">
      <h1>NG22 Shop</h1>
      <p>
        Shell (host) que carga dos microfrontends en runtime con Native Federation. El header y el
        router son del shell; cada sección es una app aparte.
      </p>
      <div class="row">
        <a class="btn btn--primary" routerLink="/catalogo">Ir al catálogo</a>
        <a class="btn" routerLink="/carrito">Ver carrito</a>
      </div>
    </section>

    <section class="card remotes">
      <h2>Remotes registrados</h2>
      <p class="muted">Leído de <code>federation.manifest.json</code> al iniciar la app.</p>
      <ul>
        @for (remote of remotes(); track remote.name) {
          <li>
            <strong>{{ remote.name }}</strong> <code>{{ remote.url }}</code>
          </li>
        } @empty {
          <li class="muted">Sin remotes.</li>
        }
      </ul>
    </section>
  `,
  styles: `
    .remotes {
      margin-top: 1rem;
    }
    ul {
      margin: 0;
      padding-left: 1.2rem;
    }
  `,
})
export class HomePage {
  private readonly manifest = httpResource<Record<string, string>>(
    () => 'federation.manifest.json',
    { defaultValue: {} },
  );

  // value() lanza si el recurso está en error: siempre chequear hasValue() antes.
  protected readonly remotes = computed(() =>
    this.manifest.hasValue()
      ? Object.entries(this.manifest.value()).map(([name, url]) => ({ name, url }))
      : [],
  );
}
