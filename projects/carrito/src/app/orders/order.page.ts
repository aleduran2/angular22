import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL, Order, apiErrorMessage } from '@shop/shared';

// En el @switch de estado: varios @case seguidos comparten bloque (v22) y `@default never;`
// obliga a cubrir todos los valores de OrderStatus.
@Component({
  selector: 'cart-order-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    @if (order.error(); as error) {
      <p class="alert alert--error" role="alert">{{ errorMessage(error) }}</p>
    } @else if (order.hasValue()) {
      @let detail = order.value();

      <section class="card">
        <h1>¡Gracias por tu compra!</h1>
        <p class="row">
          <span
            >Pedido <strong>#{{ detail.id }}</strong></span
          >
          <span class="muted">{{ detail.createdAt | date: 'short' }}</span>

          @switch (detail.status) {
            @case ('pending')
            @case ('paid') {
              <span class="badge badge--warn">En preparación</span>
            }
            @case ('shipped') {
              <span class="badge badge--ok">Enviado</span>
            }
            @case ('cancelled') {
              <span class="badge badge--off">Cancelado</span>
            }
            @default never;
          }
        </p>

        <table>
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Cantidad</th>
              <th scope="col">Importe</th>
            </tr>
          </thead>
          <tbody>
            @for (line of detail.items; track line.productId) {
              <tr>
                <td>{{ line.name }}</td>
                <td>{{ line.quantity }}</td>
                <td>{{ line.price * line.quantity | currency }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            @if (detail.discount > 0) {
              <tr>
                <th scope="row" colspan="2">Descuento</th>
                <td>-{{ detail.discount | currency }}</td>
              </tr>
            }
            <tr>
              <th scope="row" colspan="2">Total</th>
              <td>
                <strong>{{ detail.total | currency }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        <p class="muted">Se envía a {{ detail.shipping.street }}, {{ detail.shipping.city }}.</p>
        <a class="btn btn--primary" routerLink="/catalogo">Seguir comprando</a>
      </section>
    } @else {
      <div class="skeleton" aria-busy="true"></div>
    }
  `,
  styles: `
    table {
      width: 100%;
      margin: 1rem 0;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 0.5rem;
      border-bottom: 1px solid var(--border);
      text-align: left;
    }
    td:last-child,
    th:last-child {
      text-align: right;
    }
  `,
})
export class OrderPage {
  private readonly apiUrl = inject(API_URL);

  readonly id = input.required<string>();

  protected readonly order = httpResource<Order>(() => `${this.apiUrl}/orders/${this.id()}`);

  protected errorMessage(error: unknown): string {
    return apiErrorMessage(error);
  }
}
