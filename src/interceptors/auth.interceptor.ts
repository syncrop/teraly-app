import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { getBackendApiBaseUrl, getBackendConfig } from '../config/backend.config';
import { AuthTokenService } from '../services/auth-token.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const { enabled } = getBackendConfig();
  const apiBaseUrl = getBackendApiBaseUrl();

  if (!enabled || !apiBaseUrl) {
    return next(request);
  }

  // Only attach tokens to backend API requests.
  if (!request.url.startsWith(apiBaseUrl)) {
    return next(request);
  }

  const tokenService = inject(AuthTokenService);

  return from(tokenService.getIdToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(request);
      }

      return next(
        request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
    }),
    catchError(() => next(request))
  );
};
