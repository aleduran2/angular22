import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { CheckoutModel, checkoutSchema, emptyCheckout } from './checkout.form';

const valid: CheckoutModel = {
  shipping: {
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    street: 'Av. Siempre Viva 742',
    city: 'Buenos Aires',
    zip: '1414',
  },
  paymentMethod: 'card',
  card: { number: '4111111111111111', holder: 'Ada Lovelace' },
  coupon: '',
  acceptTerms: true,
};

// form() necesita un contexto de inyección; no hace falta renderizar ningún componente.
function createForm(model: CheckoutModel) {
  const state = signal(model);
  const tree = TestBed.runInInjectionContext(() => form(state, checkoutSchema));
  return { state, tree };
}

const messages = (errors: readonly { message?: string }[]) => errors.map((e) => e.message);

describe('checkoutSchema', () => {
  it('accepts a complete order', () => {
    expect(createForm(valid).tree().valid()).toBe(true);
  });

  it('rejects an empty form', () => {
    const { tree } = createForm(emptyCheckout());

    expect(tree().invalid()).toBe(true);
    expect(messages(tree.shipping.fullName().errors())).toContain('Ingresá tu nombre completo');
    expect(messages(tree.acceptTerms().errors())).toContain('Tenés que aceptar los términos');
  });

  it('validates email and zip formats', () => {
    const { tree } = createForm({
      ...valid,
      shipping: { ...valid.shipping, email: 'nope', zip: '12' },
    });

    expect(messages(tree.shipping.email().errors())).toEqual(['El email no es válido']);
    expect(messages(tree.shipping.zip().errors())).toEqual(['El código postal tiene 4 dígitos']);
  });

  it('requires card data only when paying by card', () => {
    const { state, tree } = createForm({ ...valid, card: { number: '', holder: '' } });
    expect(tree.card.number().invalid()).toBe(true);
    expect(tree.card().hidden()).toBe(false);

    state.update((model) => ({ ...model, paymentMethod: 'transfer' }));

    expect(tree.card().hidden()).toBe(true);
    expect(tree().valid()).toBe(true);
  });
});
