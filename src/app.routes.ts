import { Routes } from '@angular/router';
import { accessGuard } from './guards/access.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login/login.component').then((c) => c.LoginComponent),
    canActivate: [accessGuard],
    data: { noAuth: true },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/auth/register/register.component').then((c) => c.RegisterComponent),
    canActivate: [accessGuard],
    data: { noAuth: true },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/auth/forgot-password/forgot-password.component').then(
        (c) => c.ForgotPasswordComponent
      ),
    canActivate: [accessGuard],
    data: { noAuth: true },
  },
  {
    path: 'app',
    loadComponent: () => import('./components/page/page.component').then((c) => c.PageComponent),
    canActivate: [accessGuard],
    children: [
      {
        path: 'home-client',
        loadComponent: () =>
          import('./components/page/client-home/client-home.component').then(
            (c) => c.ClientHomeComponent
          ),
        canActivate: [accessGuard],
        data: { expectedRole: 'client' },
      },
      {
        path: 'home-doctor',
        loadComponent: () =>
          import('./components/page/doctor-home/doctor-home.component').then(
            (c) => c.DoctorHomeComponent
          ),
        canActivate: [accessGuard],
        data: { expectedRole: 'doctor' },
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./components/page/search/search.component').then((c) => c.SearchComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/page/profile/profile.component').then((c) => c.ProfileComponent),
      },
      {
        path: '',
        redirectTo: 'home-client',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
