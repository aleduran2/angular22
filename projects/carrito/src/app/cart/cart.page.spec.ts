import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService, Product } from '@shop/shared';
import { CartPage } from './cart.page';

const product = (id: number, name: string, price: number): Product => ({
  id,
  name,
  price,
  category: 'audio',
  stock: 5,
  rating: 4,
  description: '',
});

describe('CartPage', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  async function setup() {
    const fixture = TestBed.createComponent(CartPage);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  const buttonByText = (element: HTMLElement, text: string) =>
    Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.includes(text))!;

  it('shows the empty state', async () => {
    const { element } = await setup();

    expect(element.textContent).toContain('Tu carrito está vacío.');
  });

  it('lists the items with the subtotal', async () => {
    const cart = TestBed.inject(CartService);
    cart.add(product(1, 'Auriculares', 100), 2);
    cart.add(product(2, 'Micrófono', 50));

    const { element } = await setup();

    expect(element.querySelectorAll('.lines li')).toHaveLength(2);
    expect(element.querySelector('.subtotal')?.textContent).toContain('$250.00');
    expect(element.textContent).toContain('3 ítems');
  });

  it('updates the cart from the stepper and the remove button', async () => {
    const cart = TestBed.inject(CartService);
    cart.add(product(1, 'Auriculares', 100));
    const { fixture, element } = await setup();

    element.querySelector<HTMLButtonElement>('[aria-label="Sumar uno"]')!.click();
    await fixture.whenStable();
    expect(cart.quantityOf(1)).toBe(2);

    buttonByText(element, 'Quitar').click();
    await fixture.whenStable();
    expect(cart.isEmpty()).toBe(true);
    expect(element.textContent).toContain('Tu carrito está vacío.');
  });
});
