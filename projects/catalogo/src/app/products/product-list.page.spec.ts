import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL, CartService, Paginated, Product } from '@shop/shared';
import { ProductListPage } from './product-list.page';

const API = 'http://api.test';

const product = (id: number, name: string): Product => ({
  id,
  name,
  category: 'audio',
  price: 10 * id,
  stock: 5,
  rating: 4,
  description: '',
});

const page = (items: Product[], total = items.length): Paginated<Product> => ({
  items,
  total,
  page: 1,
  pageSize: 6,
});

describe('ProductListPage', () => {
  let fixture: ComponentFixture<ProductListPage>;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
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
    fixture = TestBed.createComponent(ProductListPage);
    element = fixture.nativeElement;
    // httpResource dispara el request al evaluar el template por primera vez.
    TestBed.tick();
    http.expectOne(`${API}/categories`).flush(['audio', 'monitores']);
  });

  afterEach(() => http.verify());

  const productsRequest = () => http.expectOne((req) => req.url === `${API}/products`);

  it('requests the first page with the default filters', async () => {
    const request = productsRequest();

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('sort')).toBe('name');
    expect(request.request.params.get('q')).toBe('');
    request.flush(page([]));
    await fixture.whenStable();
  });

  it('shows a loading state and then the products', async () => {
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();

    productsRequest().flush(page([product(1, 'Auriculares'), product(2, 'Micrófono')]));
    await fixture.whenStable();

    expect(element.querySelectorAll('cat-product-card')).toHaveLength(2);
    expect(element.textContent).toContain('2 productos');
  });

  it('shows an empty message when nothing matches', async () => {
    productsRequest().flush(page([]));
    await fixture.whenStable();

    expect(element.textContent).toContain('No hay productos para esos filtros.');
  });

  it('shows the error and retries on demand', async () => {
    productsRequest().flush({ message: 'Se rompió' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Se rompió');

    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    TestBed.tick();
    productsRequest().flush(page([product(1, 'Auriculares')]));
    await fixture.whenStable();

    expect(element.querySelectorAll('cat-product-card')).toHaveLength(1);
  });

  it('adds a product to the shared cart', async () => {
    productsRequest().flush(page([product(1, 'Auriculares')]));
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('cat-product-card button')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(CartService).quantityOf(1)).toBe(1);
    expect(element.querySelector('cat-product-card button')?.textContent).toContain('(1)');
  });

  it('requests the next page when paginating', async () => {
    productsRequest().flush(page([product(1, 'Auriculares')], 12));
    await fixture.whenStable();

    const next = Array.from(element.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Siguiente'),
    )!;
    next.click();
    TestBed.tick();

    const request = productsRequest();
    expect(request.request.params.get('page')).toBe('2');
    request.flush(page([product(7, 'Parlantes')], 12));
    await fixture.whenStable();
  });
});
