import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * accessGuard responsibilities:
 * - When route.data.noAuth === true: allow only unauthenticated users (used for login/register/forgot-password).
 * - Otherwise: require authentication; if route.data.expectedRole is set, require that role.
 * - Redirects to appropriate pages when checks fail.
 */
export const accessGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const noAuth = route?.data?.['noAuth'] ?? false;
  const expectedRole: string | undefined = route?.data?.['expectedRole'];
  const currentRole = authService.currentUserRole();

  // If route is for unauthenticated users only (login/register/...)
  if (noAuth) {
    if (!currentRole) {
      return true; // allow unauthenticated access
    }

    // already logged in -> redirect to their home
    if (currentRole === 'doctor') {
      return router.parseUrl('/app/home-doctor');
    }
    return router.parseUrl('/app/home-client');
  }

  // Default: require authentication
  if (!currentRole) {
    // not logged in -> redirect to login (preserve attempted URL as query param)
    const loginUrl = `/login`;
    return router.parseUrl(loginUrl);
  }

  // If an expected role is required, check it
  if (expectedRole) {
    if (currentRole === expectedRole) {
      return true;
    }

    // wrong role -> redirect to their own home
    if (currentRole === 'doctor') {
      return router.parseUrl('/app/home-doctor');
    }
    return router.parseUrl('/app/home-client');
  }

  // Authenticated and no specific role required
  return true;
};
