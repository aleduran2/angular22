import { PaymentMethod, ShippingAddress } from '@shop/shared';
import {
  applyWhen,
  email,
  hidden,
  minLength,
  pattern,
  required,
  schema,
  validate,
} from '@angular/forms/signals';

export interface CheckoutModel {
  shipping: ShippingAddress;
  paymentMethod: PaymentMethod;
  card: { number: string; holder: string };
  coupon: string;
  acceptTerms: boolean;
}

export function emptyCheckout(shipping: Partial<ShippingAddress> = {}): CheckoutModel {
  return {
    shipping: { fullName: '', email: '', street: '', city: '', zip: '', ...shipping },
    paymentMethod: 'card',
    card: { number: '', holder: '' },
    coupon: '',
    acceptTerms: false,
  };
}

// El schema vive separado del componente: se reutiliza y se testea sin renderizar nada.
export const checkoutSchema = schema<CheckoutModel>((path) => {
  required(path.shipping.fullName, { message: 'Ingresá tu nombre completo' });
  minLength(path.shipping.fullName, 3, { message: 'El nombre es demasiado corto' });
  required(path.shipping.email, { message: 'Ingresá tu email' });
  email(path.shipping.email, { message: 'El email no es válido' });
  required(path.shipping.street, { message: 'Ingresá la dirección' });
  required(path.shipping.city, { message: 'Ingresá la ciudad' });
  required(path.shipping.zip, { message: 'Ingresá el código postal' });
  pattern(path.shipping.zip, /^\d{4}$/, { message: 'El código postal tiene 4 dígitos' });

  // Validación condicional: la tarjeta solo se exige si se paga con tarjeta.
  hidden(path.card, ({ valueOf }) => valueOf(path.paymentMethod) !== 'card');
  applyWhen(
    path.card,
    ({ valueOf }) => valueOf(path.paymentMethod) === 'card',
    (card) => {
      required(card.number, { message: 'Ingresá el número de tarjeta' });
      pattern(card.number, /^\d{16}$/, { message: 'La tarjeta tiene 16 dígitos, sin espacios' });
      required(card.holder, { message: 'Ingresá el titular' });
    },
  );

  // Validador propio: devuelve un error o null/undefined si está todo bien.
  validate(path.acceptTerms, ({ value }) =>
    value() ? null : { kind: 'terms', message: 'Tenés que aceptar los términos' },
  );
});
