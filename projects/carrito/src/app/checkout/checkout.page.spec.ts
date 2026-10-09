import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { API_URL, CartService, Order, Product } from '@shop/shared';
import { CheckoutPage } from './checkout.page';

const API = 'http://api.test';
const product: Product = {
  id: 1,
  name: 'Teclado',
  category: 'perifericos',
  price: 80,
  stock: 5,
  rating: 4,
  description: '',
};

@Component({ template: 'pedido' })
class OrderStub {}

describe('CheckoutPage', () => {
  let http: HttpTestingController;
  let element: HTMLElement;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'carrito/checkout', component: CheckoutPage },
          { path: 'carrito/pedido/:id', component: OrderStub },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(CartService).add(product, 2);

    // RouterTestingHarness renderiza el componente detrás de una ruta real: sirve para
    // probar navegación relativa y guards sin mockear el Router.
    harness = await RouterTestingHarness.create('/carrito/checkout');
    element = harness.routeNativeElement!;
  });

  afterEach(() => http.verify());

  function type(label: string, value: string): void {
    const labelElement = Array.from(element.querySelectorAll('label')).find((l) =>
      l.textContent?.includes(label),
    )!;
    const input = labelElement.querySelector('input')!;
    if (input.type === 'checkbox') {
      input.click();
    } else {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  async function fillAndSubmit(zip: string): Promise<void> {
    type('Nombre completo', 'Ada Lovelace');
    type('Email', 'ada@example.com');
    type('Dirección', 'Av. Siempre Viva 742');
    type('Ciudad', 'Buenos Aires');
    type('Código postal', zip);
    type('Número de tarjeta', '4111111111111111');
    type('Titular', 'Ada Lovelace');
    type('Acepto los términos', '');
    await harness.fixture.whenStable();
    await submit();
  }

  async function submit(): Promise<void> {
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable();
  }

  it('does not call the API while the form is invalid', async () => {
    await submit();

    http.expectNone(`${API}/orders`);
    expect(element.textContent).toContain('Ingresá tu nombre completo');
    expect(element.textContent).toContain('Revisá los campos marcados');
  });

  it('creates the order, empties the cart and navigates to the confirmation', async () => {
    await fillAndSubmit('1414');

    const request = http.expectOne(`${API}/orders`);
    expect(request.request.body).toMatchObject({
      items: [{ productId: 1, quantity: 2 }],
      paymentMethod: 'card',
      shipping: { fullName: 'Ada Lovelace', zip: '1414' },
    });
    request.flush({ id: 'abc123' } as Order);

    // Lo que sigue al flush corre en promesas: expect.poll reintenta hasta que se cumpla.
    await expect.poll(() => TestBed.inject(Router).url).toBe('/carrito/pedido/abc123');
    expect(TestBed.inject(CartService).isEmpty()).toBe(true);
  });

  it('shows server validation errors next to their field', async () => {
    await fillAndSubmit('0000');

    http.expectOne(`${API}/orders`).flush(
      {
        message: 'Revisá los datos del pedido',
        errors: [{ field: 'shipping.zip', message: 'No hacemos envíos a ese código postal' }],
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    await expect.poll(() => element.textContent).toContain('No hacemos envíos a ese código postal');
    expect(TestBed.inject(CartService).isEmpty()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/carrito/checkout');
  });
});
