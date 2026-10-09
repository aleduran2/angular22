import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL, CartService, Product } from '@shop/shared';
import { ProductDetailPage } from './product-detail.page';

const API = 'http://api.test';
const product: Product = {
  id: 3,
  name: 'Monitor 27" 4K',
  category: 'monitores',
  price: 420,
  stock: 4,
  rating: 4.8,
  description: 'Panel IPS',
};

describe('ProductDetailPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  function setup() {
    const fixture = TestBed.createComponent(ProductDetailPage);
    fixture.componentRef.setInput('id', String(product.id));
    TestBed.tick();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('loads the product from the route id', async () => {
    const { fixture, element } = setup();

    http.expectOne(`${API}/products/3`).flush(product);
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toBe('Monitor 27" 4K');
    expect(element.querySelector('.price')?.textContent).toContain('$420.00');
  });

  it('adds the selected quantity to the cart', async () => {
    const { fixture, element } = setup();
    http.expectOne(`${API}/products/3`).flush(product);
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('[aria-label="Sumar uno"]')!.click();
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('.btn--primary')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(CartService).quantityOf(product.id)).toBe(2);
    expect(element.textContent).toContain('Tenés 2 en el');
  });

  it('shows the API error when the product does not exist', async () => {
    const { fixture, element } = setup();

    http
      .expectOne(`${API}/products/3`)
      .flush({ message: 'Producto no encontrado' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Producto no encontrado',
    );
  });
});
