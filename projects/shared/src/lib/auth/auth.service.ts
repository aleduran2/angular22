import { HttpClient } from '@angular/common/http';
import { Service, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthSession } from '../core/models';
import { API_URL, STORAGE } from '../core/tokens';

const STORAGE_KEY = 'shop.session';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly storage = inject(STORAGE);
  private readonly session = signal<AuthSession | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  constructor() {
    effect(() => {
      const session = this.session();
      if (session) this.storage.setItem(STORAGE_KEY, JSON.stringify(session));
      else this.storage.removeItem(STORAGE_KEY);
    });
  }

  async login(email: string, password: string): Promise<void> {
    const session = await firstValueFrom(
      this.http.post<AuthSession>(`${this.apiUrl}/auth/login`, { email, password }),
    );
    this.session.set(session);
  }

  logout(): void {
    this.session.set(null);
  }

  private restore(): AuthSession | null {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }
}
