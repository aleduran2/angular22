import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { API_URL } from '../core/tokens';
import { LoginPage } from './login.page';

const API = 'http://api.test';

@Component({ template: 'checkout' })
class CheckoutStub {}

describe('LoginPage', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let element: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'login', component: LoginPage },
            { path: 'carrito/checkout', component: CheckoutStub },
          ],
          withComponentInputBinding(),
        ),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create('/login?returnUrl=%2Fcarrito%2Fcheckout');
    element = harness.routeNativeElement!;
  });

  afterEach(() => http.verify());

  async function submit(email: string, password: string): Promise<void> {
    const [emailInput, passwordInput] = Array.from(element.querySelectorAll('input'));
    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable();
  }

  it('validates before calling the API', async () => {
    await submit('not-an-email', '');

    http.expectNone(`${API}/auth/login`);
    expect(element.textContent).toContain('El email no es válido');
    expect(element.textContent).toContain('Ingresá tu contraseña');
  });

  it('logs in and returns to the url that required the session', async () => {
    await submit('ada@example.com', 'angular22');

    http
      .expectOne(`${API}/auth/login`)
      .flush({ token: 't', user: { email: 'ada@example.com', name: 'ada' } });

    await expect.poll(() => TestBed.inject(Router).url).toBe('/carrito/checkout');
  });

  it('shows the API message when the credentials are wrong', async () => {
    await submit('ada@example.com', 'wrong');

    http
      .expectOne(`${API}/auth/login`)
      .flush(
        { message: 'Email o contraseña incorrectos' },
        { status: 401, statusText: 'Unauthorized' },
      );

    await expect
      .poll(() => element.querySelector('.alert')?.textContent)
      .toContain('Email o contraseña incorrectos');
    expect(TestBed.inject(Router).url).toContain('/login');
  });
});
