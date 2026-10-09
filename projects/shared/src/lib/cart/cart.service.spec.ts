import { TestBed } from '@angular/core/testing';
import { Product } from '../core/models';
import { STORAGE } from '../core/tokens';
import { CartService } from './cart.service';

const keyboard: Product = {
  id: 1,
  name: 'Teclado',
  category: 'perifericos',
  price: 80,
  stock: 3,
  rating: 4.5,
  description: '',
};
const mouse: Product = { ...keyboard, id: 2, name: 'Mouse', price: 35, stock: 10 };

describe('CartService', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    const cart = TestBed.inject(CartService);

    expect(cart.isEmpty()).toBe(true);
    expect(cart.count()).toBe(0);
    expect(cart.subtotal()).toBe(0);
  });

  it('adds products and derives count and subtotal', () => {
    const cart = TestBed.inject(CartService);

    cart.add(keyboard);
    cart.add(keyboard);
    cart.add(mouse);

    expect(cart.items()).toHaveLength(2);
    expect(cart.count()).toBe(3);
    expect(cart.subtotal()).toBe(80 * 2 + 35);
    expect(cart.quantityOf(keyboard.id)).toBe(2);
  });

  it('never exceeds the available stock', () => {
    const cart = TestBed.inject(CartService);

    cart.add(keyboard, 10);
    expect(cart.quantityOf(keyboard.id)).toBe(keyboard.stock);

    cart.setQuantity(keyboard.id, 99);
    expect(cart.quantityOf(keyboard.id)).toBe(keyboard.stock);
  });

  it('ignores products without stock', () => {
    const cart = TestBed.inject(CartService);

    cart.add({ ...keyboard, stock: 0 });

    expect(cart.isEmpty()).toBe(true);
  });

  it('removes the item when its quantity drops to zero', () => {
    const cart = TestBed.inject(CartService);
    cart.add(keyboard);
    cart.add(mouse);

    cart.setQuantity(keyboard.id, 0);

    expect(cart.items().map((i) => i.productId)).toEqual([mouse.id]);
  });

  it('persists changes and restores them in a new instance', () => {
    const cart = TestBed.inject(CartService);
    cart.add(keyboard, 2);
    TestBed.tick();

    TestBed.resetTestingModule();
    const restored = TestBed.inject(CartService);

    expect(restored.quantityOf(keyboard.id)).toBe(2);
  });

  it('starts empty when the stored value is corrupt', () => {
    const storage = { getItem: () => '{not json', setItem: () => undefined } as unknown as Storage;
    TestBed.configureTestingModule({ providers: [{ provide: STORAGE, useValue: storage }] });

    expect(TestBed.inject(CartService).isEmpty()).toBe(true);
  });
});
