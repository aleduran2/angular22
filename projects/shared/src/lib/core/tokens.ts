import { InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL', {
  factory: () => 'http://localhost:3000/api',
});

// Token en lugar de usar `localStorage` directo: permite reemplazarlo en tests y en SSR.
export const STORAGE = new InjectionToken<Storage>('STORAGE', {
  factory: () => localStorage,
});
