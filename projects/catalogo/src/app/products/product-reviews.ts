import { Component, inject, input, resource } from '@angular/core';
import { API_URL, Review } from '@shop/shared';

@Component({
  selector: 'cat-product-reviews',
  template: `
    <section aria-labelledby="reviews-title">
      <h2 id="reviews-title">Opiniones</h2>

      @if (reviews.error()) {
        <p class="alert alert--error" role="alert">
          No se pudieron cargar las opiniones.
          <button type="button" class="btn btn--link" (click)="reviews.reload()">Reintentar</button>
        </p>
      } @else if (reviews.hasValue()) {
        <ul class="reviews">
          @for (review of reviews.value(); track review.id) {
            <li class="card">
              <strong>{{ review.author }}</strong>
              <span aria-label="{{ review.rating }} de 5 estrellas">
                {{ '★'.repeat(review.rating) }}
              </span>
              <p>{{ review.comment }}</p>
            </li>
          } @empty {
            <li class="muted">Este producto todavía no tiene opiniones.</li>
          }
        </ul>
      } @else {
        <div class="skeleton" aria-busy="true"></div>
      }
    </section>
  `,
  styles: `
    .reviews {
      display: grid;
      gap: 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    p {
      margin: 0.25rem 0 0;
    }
  `,
})
export class ProductReviews {
  private readonly apiUrl = inject(API_URL);

  readonly productId = input.required<number>();

  // resource() genérico: cualquier Promise. Con fetch no pasan los interceptors de HttpClient;
  // abortSignal cancela el pedido anterior si productId cambia antes de que termine.
  protected readonly reviews = resource({
    params: () => this.productId(),
    loader: async ({ params: productId, abortSignal }) => {
      const response = await fetch(`${this.apiUrl}/products/${productId}/reviews`, {
        signal: abortSignal,
      });
      if (!response.ok) throw new Error(`Error ${response.status} al cargar opiniones`);
      return (await response.json()) as Review[];
    },
  });
}
