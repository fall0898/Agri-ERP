import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notif = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          localStorage.clear();
          router.navigate(['/connexion']);
          break;
        case 403:
          notif.error(error.error?.message || 'Accès refusé.');
          break;
        case 422:
          // validation errors — let components handle these
          break;
        case 429:
          notif.warning('Trop de requêtes. Veuillez patienter.');
          break;
        case 0:
        case 503:
          notif.error('Impossible de contacter le serveur. Vérifiez votre connexion.');
          break;
      }
      return throwError(() => error);
    })
  );
};
