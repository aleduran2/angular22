import { Component, inject } from '@angular/core';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'shop-toast-outlet',
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.kind">
          <span>{{ toast.message }}</span>
          <button type="button" aria-label="Cerrar" (click)="notifications.dismiss(toast.id)">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      display: grid;
      gap: 0.5rem;
      z-index: 10;
    }
    .toast {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      padding: 0.6rem 0.9rem;
      border-radius: var(--radius);
      background: var(--text);
      color: var(--surface);
      box-shadow: var(--shadow);
    }
    .toast--error {
      background: var(--danger);
    }
    .toast--success {
      background: var(--success);
    }
    button {
      border: 0;
      background: none;
      color: inherit;
      font-size: 1.1rem;
      cursor: pointer;
    }
  `,
})
export class ToastOutlet {
  protected readonly notifications = inject(NotificationService);
}
