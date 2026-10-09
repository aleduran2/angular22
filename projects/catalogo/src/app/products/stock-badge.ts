import { Component, computed, input } from '@angular/core';
import { stockLevel } from './stock';

// `@default never;` (v22) hace el @switch exhaustivo: si se agrega un valor a StockLevel
// y falta su @case, el template no compila.
@Component({
  selector: 'cat-stock-badge',
  template: `
    @let current = level();
    @switch (current) {
      @case ('available') {
        <span class="badge badge--ok">En stock</span>
      }
      @case ('low') {
        <span class="badge badge--warn">Quedan {{ stock() }}</span>
      }
      @case ('out') {
        <span class="badge badge--off">Sin stock</span>
      }
      @default never;
    }
  `,
})
export class StockBadge {
  readonly stock = input.required<number>();

  protected readonly level = computed(() => stockLevel({ stock: this.stock() }));
}
