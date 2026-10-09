import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, TreeValidationResult, form } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  API_URL,
  AuthService,
  CartService,
  FieldError,
  Order,
  OrderRequest,
  apiErrorMessage,
  apiFieldErrors,
} from '@shop/shared';
import { firstValueFrom } from 'rxjs';
import { CheckoutModel, checkoutSchema, emptyCheckout } from './checkout.form';

@Component({
  selector: 'cart-checkout-page',
  imports: [CurrencyPipe, RouterLink, FormField, FormRoot, FieldError],
  template: `
    <a routerLink=".." class="btn btn--link">← Volver al carrito</a>
    <h1>Finalizar compra</h1>

    @if (cart.isEmpty()) {
      <p class="card">
        No hay productos para comprar. <a routerLink="/catalogo">Ir al catálogo</a>
      </p>
    } @else {
      <form class="form card" [formRoot]="checkoutForm">
        <fieldset>
          <legend>Envío</legend>

          <label>
            Nombre completo
            <input type="text" autocomplete="name" [formField]="checkoutForm.shipping.fullName" />
          </label>
          <shop-field-error [state]="checkoutForm.shipping.fullName()" />

          <label>
            Email
            <input type="email" autocomplete="email" [formField]="checkoutForm.shipping.email" />
          </label>
          <shop-field-error [state]="checkoutForm.shipping.email()" />

          <label>
            Dirección
            <input
              type="text"
              autocomplete="street-address"
              [formField]="checkoutForm.shipping.street"
            />
          </label>
          <shop-field-error [state]="checkoutForm.shipping.street()" />

          <div class="two-columns">
            <div>
              <label>
                Ciudad
                <input
                  type="text"
                  autocomplete="address-level2"
                  [formField]="checkoutForm.shipping.city"
                />
              </label>
              <shop-field-error [state]="checkoutForm.shipping.city()" />
            </div>
            <div>
              <label>
                Código postal
                <input
                  type="text"
                  inputmode="numeric"
                  autocomplete="postal-code"
                  [formField]="checkoutForm.shipping.zip"
                />
              </label>
              <shop-field-error [state]="checkoutForm.shipping.zip()" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Pago</legend>

          <label>
            Medio de pago
            <select [formField]="checkoutForm.paymentMethod">
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="cash">Efectivo</option>
            </select>
          </label>

          @if (!checkoutForm.card().hidden()) {
            <label>
              Número de tarjeta
              <input
                type="text"
                inputmode="numeric"
                autocomplete="cc-number"
                [formField]="checkoutForm.card.number"
              />
            </label>
            <shop-field-error [state]="checkoutForm.card.number()" />

            <label>
              Titular
              <input type="text" autocomplete="cc-name" [formField]="checkoutForm.card.holder" />
            </label>
            <shop-field-error [state]="checkoutForm.card.holder()" />
          }

          <label>
            Cupón (opcional)
            <input type="text" [formField]="checkoutForm.coupon" />
          </label>
          <shop-field-error [state]="checkoutForm.coupon()" />
        </fieldset>

        <label class="checkbox">
          <input type="checkbox" [formField]="checkoutForm.acceptTerms" />
          Acepto los términos y condiciones
        </label>
        <shop-field-error [state]="checkoutForm.acceptTerms()" />

        @if (serverError(); as message) {
          <p class="alert alert--error" role="alert">{{ message }}</p>
        }

        <div class="row row--between">
          <strong>Total: {{ cart.subtotal() | currency }}</strong>
          <button type="submit" class="btn btn--primary" [disabled]="checkoutForm().submitting()">
            {{ checkoutForm().submitting() ? 'Enviando…' : 'Confirmar pedido' }}
          </button>
        </div>
      </form>
    }
  `,
  styles: `
    fieldset {
      display: grid;
      gap: 0.75rem;
      margin: 0;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    legend {
      padding: 0 0.4rem;
      font-weight: 700;
    }
    .two-columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
    }
    .two-columns > div {
      display: grid;
      gap: 0.75rem;
      align-content: start;
    }
    .form .checkbox {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-weight: 400;
    }
  `,
})
export class CheckoutPage {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);

  protected readonly serverError = signal<string | null>(null);

  private readonly model = signal<CheckoutModel>(
    emptyCheckout({ email: this.auth.user()?.email ?? '' }),
  );

  // [formRoot] llama a `action` al enviar, solo si el formulario es válido.
  protected readonly checkoutForm = form(this.model, checkoutSchema, {
    submission: {
      action: () => this.placeOrder(),
      onInvalid: () => this.serverError.set('Revisá los campos marcados'),
    },
  });

  private async placeOrder(): Promise<TreeValidationResult> {
    this.serverError.set(null);
    const { shipping, paymentMethod, coupon } = this.model();
    const request: OrderRequest = {
      items: this.cart.items().map(({ productId, quantity }) => ({ productId, quantity })),
      shipping,
      paymentMethod,
      coupon: coupon.trim(),
    };

    try {
      const order = await firstValueFrom(this.http.post<Order>(`${this.apiUrl}/orders`, request));
      this.cart.clear();
      await this.router.navigate(['../pedido', order.id], { relativeTo: this.route });
      return undefined;
    } catch (error) {
      return this.toFormErrors(error);
    }
  }

  // Los errores de validación del servidor se devuelven atados a su campo: Signal Forms
  // los muestra igual que a los errores del schema.
  private toFormErrors(error: unknown): TreeValidationResult {
    const serverFields = {
      'shipping.zip': this.checkoutForm.shipping.zip,
      coupon: this.checkoutForm.coupon,
    };
    const fieldErrors = apiFieldErrors(error);
    const mapped = fieldErrors.flatMap(({ field, message }) =>
      field in serverFields
        ? [{ kind: 'server', message, fieldTree: serverFields[field as keyof typeof serverFields] }]
        : [],
    );

    const unmapped = fieldErrors.filter(({ field }) => !(field in serverFields));
    this.serverError.set(
      unmapped.length > 0 || mapped.length === 0
        ? (unmapped[0]?.message ?? apiErrorMessage(error))
        : 'Revisá los campos marcados',
    );
    return mapped;
  }
}
