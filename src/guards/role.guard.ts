import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['expectedRole'];
  const currentRole = authService.currentUserRole();
  
  if (!currentRole) {
     return router.parseUrl('/login');
  }

  if (currentRole === expectedRole) {
    return true;
  }

  // Redirect to their own home page if they try to access the wrong one
  if (currentRole === 'client') {
    return router.parseUrl('/app/home-client');
  } else if (currentRole === 'doctor') {
    return router.parseUrl('/app/home-doctor');
  }

  // Fallback redirect to login
  return router.parseUrl('/login');
};
