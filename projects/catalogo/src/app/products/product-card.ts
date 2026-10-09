import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '@shop/shared';
import { StockBadge } from './stock-badge';

@Component({
  selector: 'cat-product-card',
  imports: [CurrencyPipe, RouterLink, StockBadge],
  template: `
    <article class="card product">
      <header class="row row--between">
        <span class="badge">{{ product().category }}</span>
        <cat-stock-badge [stock]="product().stock" />
      </header>

      <h2>
        <a [routerLink]="[product().id]">{{ product().name }}</a>
      </h2>
      <p class="muted">{{ product().description }}</p>

      <footer class="row row--between">
        <strong class="price">{{ product().price | currency }}</strong>
        <button
          type="button"
          class="btn btn--primary"
          // v22: se pueden comentar atributos dentro del tag.
          [disabled]="!canAdd()"
          (click)="add.emit(product())"
        >
          {{ inCart() > 0 ? 'Agregar otro (' + inCart() + ')' : 'Agregar' }}
        </button>
      </footer>
    </article>
  `,
  styles: `
    .product {
      display: grid;
      gap: 0.5rem;
      height: 100%;
    }
    h2 {
      margin: 0;
    }
    p {
      margin: 0;
    }
    .price {
      font-size: 1.2rem;
    }
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly inCart = input(0);
  readonly add = output<Product>();

  protected readonly canAdd = computed(() => this.inCart() < this.product().stock);
}
