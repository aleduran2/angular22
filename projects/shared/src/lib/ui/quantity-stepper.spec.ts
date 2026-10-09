import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QuantityStepper } from './quantity-stepper';

@Component({
  imports: [QuantityStepper],
  template: `<shop-quantity-stepper [(value)]="quantity" [max]="3" />`,
})
class Host {
  readonly quantity = signal(1);
}

describe('QuantityStepper', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const [minus, plus] = Array.from(element.querySelectorAll('button'));
    return { fixture, host: fixture.componentInstance, element, minus, plus };
  }

  it('updates the bound signal through two-way binding', async () => {
    const { fixture, host, element, plus } = await setup();

    plus.click();
    await fixture.whenStable();

    expect(host.quantity()).toBe(2);
    expect(element.querySelector('output')?.textContent).toBe('2');
  });

  it('disables the buttons at the limits', async () => {
    const { fixture, host, minus, plus } = await setup();
    expect(minus.disabled).toBe(true);

    host.quantity.set(3);
    await fixture.whenStable();

    expect(plus.disabled).toBe(true);
    expect(minus.disabled).toBe(false);
  });
});
