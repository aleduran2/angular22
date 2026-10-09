import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, CartService, Product } from '@shop/shared';
import { App } from './app';

const product: Product = {
  id: 1,
  name: 'Teclado',
  category: 'perifericos',
  price: 80,
  stock: 5,
  rating: 4,
  description: '',
};

describe('App (shell)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('renders the navigation and the login link for anonymous users', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const links = Array.from(element.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['Catálogo', 'Carrito']);
    expect(element.querySelector('.session')?.textContent).toContain('Ingresar');
  });

  it('reflects cart changes made anywhere in the app', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[data-testid="cart-count"]')).toBeNull();

    TestBed.inject(CartService).add(product, 2);
    await fixture.whenStable();

    expect(element.querySelector('[data-testid="cart-count"]')?.textContent).toBe('2');
  });

  it('greets the logged-in user and logs out', async () => {
    const auth = TestBed.inject(AuthService);
    const pending = auth.login('ada@example.com', 'angular22');
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/auth/login'))
      .flush({ token: 't', user: { email: 'ada@example.com', name: 'ada' } });
    await pending;

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const session = (fixture.nativeElement as HTMLElement).querySelector('.session')!;
    expect(session.textContent).toContain('Hola, ada');

    session.querySelector('button')!.click();
    await fixture.whenStable();

    expect(auth.isAuthenticated()).toBe(false);
    expect(session.textContent).toContain('Ingresar');
  });
});
