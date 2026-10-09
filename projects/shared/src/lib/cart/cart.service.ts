import { Service, computed, effect, inject, signal } from '@angular/core';
import { CartItem, Product } from '../core/models';
import { STORAGE } from '../core/tokens';

const STORAGE_KEY = 'shop.cart';

// @Service() (v22) equivale a @Injectable({ providedIn: 'root' }).
// Como la lib se comparte por federation, shell y remotes reciben la misma instancia.
@Service()
export class CartService {
  private readonly storage = inject(STORAGE);
  private readonly _items = signal<CartItem[]>(this.restore());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    effect(() => this.storage.setItem(STORAGE_KEY, JSON.stringify(this._items())));
  }

  quantityOf(productId: number): number {
    return this._items().find((i) => i.productId === productId)?.quantity ?? 0;
  }

  add(product: Product, quantity = 1): void {
    const current = this.quantityOf(product.id);
    const next = Math.min(current + quantity, product.stock);
    if (next <= 0) return;

    if (current === 0) {
      const item: CartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        quantity: next,
      };
      this._items.update((items) => [...items, item]);
    } else {
      this.setQuantity(product.id, next);
    }
  }

  setQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    this._items.update((items) =>
      items.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i,
      ),
    );
  }

  remove(productId: number): void {
    this._items.update((items) => items.filter((i) => i.productId !== productId));
  }

  clear(): void {
    this._items.set([]);
  }

  private restore(): CartItem[] {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
