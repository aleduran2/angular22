import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService, QuantityStepper } from '@shop/shared';

@Component({
  selector: 'cart-cart-page',
  imports: [CurrencyPipe, RouterLink, QuantityStepper],
  template: `
    <h1>Carrito</h1>

    @if (cart.isEmpty()) {
      <div class="card">
        <p>Tu carrito está vacío.</p>
        <a class="btn btn--primary" routerLink="/catalogo">Ver catálogo</a>
      </div>
    } @else {
      <ul class="lines">
        @for (item of cart.items(); track item.productId) {
          <li class="card row row--between">
            <div class="line-name">
              <strong>{{ item.name }}</strong>
              <div class="muted">{{ item.price | currency }} c/u</div>
            </div>
            <shop-quantity-stepper
              [value]="item.quantity"
              [max]="item.stock"
              (valueChange)="cart.setQuantity(item.productId, $event)"
            />
            <strong class="line-total">{{ item.price * item.quantity | currency }}</strong>
            <button type="button" class="btn btn--link" (click)="cart.remove(item.productId)">
              Quitar
            </button>
          </li>
        }
      </ul>

      @let count = cart.count();
      <footer class="card row row--between">
        <span>Subtotal ({{ count }} {{ count === 1 ? 'ítem' : 'ítems' }})</span>
        <strong class="subtotal">{{ cart.subtotal() | currency }}</strong>
        <div class="row">
          <button type="button" class="btn" (click)="cart.clear()">Vaciar</button>
          <a class="btn btn--primary" routerLink="checkout">Finalizar compra</a>
        </div>
      </footer>
    }
  `,
  styles: `
    .lines {
      display: grid;
      gap: 0.75rem;
      margin: 1rem 0;
      padding: 0;
      list-style: none;
    }
    .line-name {
      flex: 1 1 12rem;
    }
    .line-total {
      min-width: 5rem;
      text-align: right;
    }
    .subtotal {
      font-size: 1.25rem;
    }
  `,
})
export class CartPage {
  protected readonly cart = inject(CartService);
}
