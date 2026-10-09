import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { API_URL } from '../core/tokens';
import { authGuard } from './auth.guard';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const API = 'http://api.test';
const session = { token: 'token-123', user: { email: 'dev@example.com', name: 'dev' } };

describe('auth', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function login(): Promise<AuthService> {
    const auth = TestBed.inject(AuthService);
    const pending = auth.login('dev@example.com', 'angular22');
    http.expectOne(`${API}/auth/login`).flush(session);
    await pending;
    return auth;
  }

  function runGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  describe('AuthService', () => {
    it('stores the session after a successful login', async () => {
      const auth = await login();

      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.user()).toEqual(session.user);
      expect(auth.token()).toBe(session.token);
    });

    it('keeps the user logged out when the API rejects the credentials', async () => {
      const auth = TestBed.inject(AuthService);
      const pending = auth.login('dev@example.com', 'wrong');
      http
        .expectOne(`${API}/auth/login`)
        .flush(
          { message: 'Email o contraseña incorrectos' },
          { status: 401, statusText: 'Unauthorized' },
        );

      await expect(pending).rejects.toMatchObject({ status: 401 });
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('clears the session on logout', async () => {
      const auth = await login();

      auth.logout();

      expect(auth.user()).toBeNull();
    });
  });

  describe('authGuard', () => {
    it('lets authenticated users through', async () => {
      await login();

      expect(runGuard('/carrito/checkout')).toBe(true);
    });

    it('redirects anonymous users to login keeping the target url', () => {
      const result = runGuard('/carrito/checkout');

      expect(result).toBeInstanceOf(UrlTree);
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
        '/login?returnUrl=%2Fcarrito%2Fcheckout',
      );
    });
  });

  describe('authInterceptor', () => {
    it('adds the token to API requests', async () => {
      await login();

      TestBed.inject(HttpClient).get(`${API}/orders/1`).subscribe();

      const request = http.expectOne(`${API}/orders/1`).request;
      expect(request.headers.get('Authorization')).toBe(`Bearer ${session.token}`);
    });

    it('does not leak the token to other hosts', async () => {
      await login();

      TestBed.inject(HttpClient).get('https://other.test/data').subscribe();

      const request = http.expectOne('https://other.test/data').request;
      expect(request.headers.has('Authorization')).toBe(false);
    });
  });
});
