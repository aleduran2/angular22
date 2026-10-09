import { httpResource } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  injectAsync,
  linkedSignal,
  onIdle,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  API_URL,
  CartService,
  NotificationService,
  Paginated,
  Product,
  apiErrorMessage,
} from '@shop/shared';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductCard } from './product-card';

type SortOption = 'name' | 'price_asc' | 'price_desc' | 'rating';

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'cat-product-list-page',
  imports: [FormsModule, ProductCard],
  template: `
    <header class="row row--between">
      <h1>Catálogo</h1>
      <button type="button" class="btn" [disabled]="!products.hasValue()" (click)="exportCsv()">
        Exportar CSV
      </button>
    </header>

    <form class="filters row" role="search" (submit)="$event.preventDefault()">
      <input
        type="search"
        name="search"
        placeholder="Buscar productos"
        aria-label="Buscar productos"
        [(ngModel)]="search"
      />
      <select name="category" aria-label="Categoría" [(ngModel)]="category">
        <option value="">Todas las categorías</option>
        @for (option of categoryOptions(); track option) {
          <option [value]="option">{{ option }}</option>
        }
      </select>
      <select name="sort" aria-label="Ordenar por" [(ngModel)]="sort">
        <option value="name">Nombre</option>
        <option value="price_asc">Menor precio</option>
        <option value="price_desc">Mayor precio</option>
        <option value="rating">Mejor puntuados</option>
      </select>
    </form>

    @if (products.error(); as error) {
      <p class="alert alert--error" role="alert">
        {{ errorMessage(error) }}
        <button type="button" class="btn btn--link" (click)="products.reload()">Reintentar</button>
      </p>
    } @else if (products.hasValue()) {
      @let result = products.value();
      <p class="muted" aria-live="polite">
        {{ result.total }} {{ result.total === 1 ? 'producto' : 'productos' }}
      </p>

      <ul class="grid">
        @for (product of result.items; track product.id) {
          <li>
            <cat-product-card
              [product]="product"
              [inCart]="cart.quantityOf(product.id)"
              (add)="addToCart($event)"
            />
          </li>
        } @empty {
          <li class="muted">No hay productos para esos filtros.</li>
        }
      </ul>

      <nav class="row" aria-label="Paginación">
        <button
          type="button"
          class="btn"
          [disabled]="page() <= 1"
          (click)="page.update((p) => p - 1)"
        >
          Anterior
        </button>
        <span>Página {{ page() }} de {{ totalPages() }}</span>
        <button
          type="button"
          class="btn"
          [disabled]="page() >= totalPages()"
          (click)="page.update((p) => p + 1)"
        >
          Siguiente
        </button>
      </nav>
    } @else {
      <ul class="grid" aria-busy="true" aria-label="Cargando productos">
        @for (placeholder of skeletons; track placeholder) {
          <li class="skeleton"></li>
        }
      </ul>
    }
  `,
  styles: `
    .filters {
      margin: 1rem 0;
    }
    .filters input,
    .filters select {
      padding: 0.5rem 0.6rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      font: inherit;
    }
    .filters input {
      flex: 1 1 14rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
      margin: 0 0 1rem;
      padding: 0;
      list-style: none;
    }
    .grid .skeleton {
      min-height: 11rem;
    }
  `,
})
export class ProductListPage {
  private readonly apiUrl = inject(API_URL);
  private readonly notifications = inject(NotificationService);
  protected readonly cart = inject(CartService);

  private readonly csvExporter = injectAsync(
    () => import('./csv-exporter').then((m) => m.CsvExporter),
    { prefetch: onIdle },
  );

  protected readonly skeletons = Array.from({ length: PAGE_SIZE }, (_, index) => index);

  protected readonly search = signal('');
  protected readonly category = signal('');
  protected readonly sort = signal<SortOption>('name');

  // Interop con RxJS: el debounce se resuelve con operadores y vuelve a ser un signal.
  private readonly debouncedSearch = toSignal(
    toObservable(this.search).pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged()),
    { initialValue: '' },
  );

  private readonly filters = computed(() => ({
    q: this.debouncedSearch().trim(),
    category: this.category(),
    sort: this.sort(),
  }));

  // linkedSignal: vuelve a 1 cuando cambian los filtros, pero se puede escribir (paginación).
  protected readonly page = linkedSignal({ source: this.filters, computation: () => 1 });

  private readonly categories = httpResource<string[]>(() => `${this.apiUrl}/categories`, {
    defaultValue: [],
  });
  // value() lanza si el recurso está en error: sin categorías el filtro queda en "Todas".
  protected readonly categoryOptions = computed(() =>
    this.categories.hasValue() ? this.categories.value() : [],
  );

  // Se vuelve a pedir sola cada vez que cambia un signal leído dentro de la función.
  protected readonly products = httpResource<Paginated<Product>>(() => ({
    url: `${this.apiUrl}/products`,
    params: { ...this.filters(), page: this.page(), pageSize: PAGE_SIZE },
  }));

  protected readonly totalPages = computed(() => {
    const total = this.products.hasValue() ? this.products.value().total : 0;
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  });

  protected errorMessage(error: unknown): string {
    return apiErrorMessage(error);
  }

  protected addToCart(product: Product): void {
    this.cart.add(product);
    this.notifications.show(`${product.name} agregado al carrito`, 'success');
  }

  protected async exportCsv(): Promise<void> {
    if (!this.products.hasValue()) return;
    try {
      const exporter = await this.csvExporter();
      const rows = this.products.value().items.map(({ id, name, category, price, stock }) => ({
        id,
        name,
        category,
        price,
        stock,
      }));
      exporter.download('productos.csv', rows);
    } catch {
      this.notifications.show('No se pudo exportar el CSV', 'error');
    }
  }
}
