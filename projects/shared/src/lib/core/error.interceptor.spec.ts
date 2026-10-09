import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { errorInterceptor } from './error.interceptor';
import { NotificationService } from './notification.service';
import { API_URL } from './tokens';

const API = 'http://api.test';

@Component({ template: '' })
class Blank {}

describe('errorInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', component: Blank }]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => http.verify());

  const messages = () =>
    TestBed.inject(NotificationService)
      .toasts()
      .map((t) => t.message);

  it('notifies server errors and rethrows them to the caller', () => {
    let status: number | undefined;
    client.get(`${API}/products`).subscribe({ error: (e) => (status = e.status) });

    http
      .expectOne(`${API}/products`)
      .flush({ message: 'Error forzado' }, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
    expect(messages()).toEqual(['Error forzado']);
  });

  it('logs out and redirects to login when the session expired', async () => {
    const auth = TestBed.inject(AuthService);
    const pending = auth.login('ada@example.com', 'angular22');
    http
      .expectOne(`${API}/auth/login`)
      .flush({ token: 't', user: { email: 'ada@example.com', name: 'ada' } });
    await pending;

    client.post(`${API}/orders`, {}).subscribe({ error: () => undefined });
    http
      .expectOne(`${API}/orders`)
      .flush({ message: 'Sesión vencida' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
    await expect.poll(() => TestBed.inject(Router).url).toContain('/login');
  });

  it('leaves validation errors to the screen that made the request', () => {
    client.post(`${API}/orders`, {}).subscribe({ error: () => undefined });

    http
      .expectOne(`${API}/orders`)
      .flush({ message: 'Revisá los datos' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(messages()).toEqual([]);
  });
});
