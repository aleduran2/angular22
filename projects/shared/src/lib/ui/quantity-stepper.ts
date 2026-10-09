import { Component, input, model } from '@angular/core';

@Component({
  selector: 'shop-quantity-stepper',
  template: `
    <button
      type="button"
      aria-label="Restar uno"
      [disabled]="value() <= min()"
      (click)="value.update((v) => v - 1)"
    >
      −
    </button>
    <output aria-live="polite">{{ value() }}</output>
    <button
      type="button"
      aria-label="Sumar uno"
      [disabled]="value() >= max()"
      (click)="value.update((v) => v + 1)"
    >
      +
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    button {
      width: 2rem;
      height: 2rem;
      border: 0;
      background: none;
      font-size: 1.1rem;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    output {
      min-width: 2rem;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class QuantityStepper {
  // model() habilita [(value)] desde el padre.
  readonly value = model.required<number>();
  readonly min = input(1);
  readonly max = input(Number.MAX_SAFE_INTEGER);
}
