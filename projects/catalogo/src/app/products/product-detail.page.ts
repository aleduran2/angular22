import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  API_URL,
  CartService,
  NotificationService,
  Product,
  QuantityStepper,
  apiErrorMessage,
} from '@shop/shared';
import { ProductReviews } from './product-reviews';
import { StockBadge } from './stock-badge';

@Component({
  selector: 'cat-product-detail-page',
  imports: [CurrencyPipe, RouterLink, QuantityStepper, StockBadge, ProductReviews],
  template: `
    <a routerLink=".." class="btn btn--link">← Volver al catálogo</a>

    @if (product.error(); as error) {
      <p class="alert alert--error" role="alert">{{ errorMessage(error) }}</p>
    } @else if (product.hasValue()) {
      @let item = product.value();

      <article class="card detail">
        <header class="row row--between">
          <h1>{{ item.name }}</h1>
          <cat-stock-badge [stock]="item.stock" />
        </header>
        <p>{{ item.description }}</p>
        <p class="price">{{ item.price | currency }}</p>

        @if (available() > 0) {
          <div class="row">
            <shop-quantity-stepper [(value)]="quantity" [max]="available()" />
            <button type="button" class="btn btn--primary" (click)="addToCart(item)">
              Agregar al carrito
            </button>
          </div>
        } @else {
          <p class="muted">No queda más stock para agregar.</p>
        }

        @if (inCart() > 0) {
          <p class="muted">Tenés {{ inCart() }} en el <a routerLink="/carrito">carrito</a>.</p>
        }
      </article>

      <!-- El chunk de ProductReviews se baja recién cuando el bloque entra al viewport. -->
      @defer (on viewport; prefetch on idle) {
        <cat-product-reviews [productId]="item.id" />
      } @placeholder {
        <div class="skeleton" aria-hidden="true"></div>
      } @loading (after 100ms; minimum 300ms) {
        <div class="skeleton" aria-busy="true"></div>
      } @error {
        <p class="alert alert--error" role="alert">No se pudo cargar la sección de opiniones.</p>
      }
    } @else {
      <div class="skeleton" aria-busy="true"></div>
    }
  `,
  styles: `
    .detail {
      display: grid;
      gap: 0.75rem;
      margin: 1rem 0 2rem;
    }
    .detail p {
      margin: 0;
    }
    .price {
      font-size: 1.5rem;
      font-weight: 700;
    }
  `,
})
export class ProductDetailPage {
  private readonly apiUrl = inject(API_URL);
  private readonly cart = inject(CartService);
  private readonly notifications = inject(NotificationService);

  // Parámetro :id de la ruta, enlazado por withComponentInputBinding().
  readonly id = input.required<string>();

  protected readonly product = httpResource<Product>(() => `${this.apiUrl}/products/${this.id()}`);

  protected readonly inCart = computed(() => this.cart.quantityOf(Number(this.id())));
  protected readonly available = computed(() =>
    this.product.hasValue() ? this.product.value().stock - this.inCart() : 0,
  );

  // Vuelve a 1 al cambiar de producto o cuando cambia lo disponible.
  protected readonly quantity = linkedSignal({ source: this.available, computation: () => 1 });

  protected errorMessage(error: unknown): string {
    return apiErrorMessage(error);
  }

  protected addToCart(product: Product): void {
    this.cart.add(product, this.quantity());
    this.notifications.show(`${product.name} agregado al carrito`, 'success');
  }
}
