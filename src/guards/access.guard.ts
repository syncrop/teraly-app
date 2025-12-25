import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * accessGuard responsibilities:
 * - When route.data.noAuth === true: allow only unauthenticated users (used for login/register/forgot-password).
 * - Otherwise: require authentication; if route.data.expectedRole is set, require that role.
 * - Redirects to appropriate pages when checks fail.
 * - If user is not authenticated, performs logout and redirects to login.
 */
export const accessGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Guard ejecutándose para:', state.url);

  // Esperar a que el AuthService termine de inicializarse
  await authService.waitForInitialization();
  console.log('Guard: AuthService inicializado');

  const noAuth = route?.data?.['noAuth'] ?? false;
  const expectedRole: string | undefined = route?.data?.['expectedRole'];
  const currentRole = authService.currentUserRole();
  const currentUser = authService.currentUser();

  console.log('Guard - currentRole:', currentRole, 'currentUser:', currentUser, 'URL:', state.url);

  // If route is for unauthenticated users only (login/register/...)
  if (noAuth) {
    if (!currentRole) {
      console.log('Permitiendo acceso a ruta pública');
      return true; // allow unauthenticated access
    }

    // already logged in -> redirect to their home
    console.log('Usuario ya autenticado, redirigiendo a home');
    if (currentRole === 'doctor') {
      return router.parseUrl('/app/home-doctor');
    }
    return router.parseUrl('/app/home-client');
  }

  // Default: require authentication
  if (!currentRole || !currentUser) {
    // No hay datos de sesión -> realmente no autenticado -> redirigir al login
    console.log('Usuario no autenticado detectado, redirigiendo al login');
    return router.parseUrl('/login');
  }

  // Usuario autenticado, determinar home según su rol
  if (state.url === '/' || state.url === '') {
    console.log('Ruta raíz detectada, redirigiendo a home del usuario');
    if (currentRole === 'doctor') {
      return router.parseUrl('/app/home-doctor');
    }
    return router.parseUrl('/app/home-client');
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
