import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.currentUserRole();
  if (!role) {
    // Not logged in — allow access to auth pages
    return true;
  }

  // Logged in — redirect based on role
  if (role === 'doctor') {
    return router.parseUrl('/app/home-doctor');
  }

  // default to client home
  return router.parseUrl('/app/home-client');
};
