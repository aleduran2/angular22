import { Component, Signal, computed, input } from '@angular/core';

// Tipado estructural: acepta el estado de cualquier campo de Signal Forms sin depender de su genérico.
export interface FieldErrorSource {
  touched: Signal<boolean>;
  errors: Signal<readonly { kind: string; message?: string }[]>;
}

@Component({
  selector: 'shop-field-error',
  template: `
    @if (message(); as text) {
      <p class="field-error" role="alert">{{ text }}</p>
    }
  `,
})
export class FieldError {
  readonly state = input.required<FieldErrorSource>();

  protected readonly message = computed(() => {
    const state = this.state();
    if (!state.touched()) return null;
    const [first] = state.errors();
    return first ? (first.message ?? first.kind) : null;
  });
}
