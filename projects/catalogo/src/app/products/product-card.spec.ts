import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Product } from '@shop/shared';
import { ProductCard } from './product-card';

const product: Product = {
  id: 7,
  name: 'Webcam 1080p',
  category: 'perifericos',
  price: 59,
  stock: 2,
  rating: 4,
  description: 'Autofoco',
};

describe('ProductCard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  async function setup(inCart = 0) {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    fixture.componentRef.setInput('inCart', inCart);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    return { fixture, element, button: element.querySelector('button')! };
  }

  it('renders the product and its stock level', async () => {
    const { element } = await setup();

    expect(element.querySelector('h2')?.textContent).toContain('Webcam 1080p');
    expect(element.textContent).toContain('$59.00');
    expect(element.textContent).toContain('Quedan 2');
  });

  it('emits the product when the button is clicked', async () => {
    const { fixture, button } = await setup();
    const emitted: Product[] = [];
    fixture.componentInstance.add.subscribe((value) => emitted.push(value));

    button.click();

    expect(emitted).toEqual([product]);
  });

  it('disables the button once the cart holds all the stock', async () => {
    const { button } = await setup(product.stock);

    expect(button.disabled).toBe(true);
  });
});
