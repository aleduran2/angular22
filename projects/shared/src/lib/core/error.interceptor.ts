import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { apiErrorMessage } from './api-error';
import { NotificationService } from './notification.service';

const LOGIN_PATH = '/auth/login';

// Maneja lo transversal (sesión vencida, API caída, 5xx). El resto lo resuelve cada pantalla.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && !req.url.endsWith(LOGIN_PATH)) {
          auth.logout();
          notifications.show(apiErrorMessage(error), 'error');
          void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        } else if (error.status === 0 || error.status >= 500) {
          notifications.show(apiErrorMessage(error), 'error');
        }
      }
      return throwError(() => error);
    }),
  );
};
