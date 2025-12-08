
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(c => c.LoginComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(c => c.RegisterComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'app',
    loadComponent: () => import('./components/page/page.component').then(c => c.PageComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'home-client',
        loadComponent: () => import('./components/page/client-home/client-home.component').then(c => c.ClientHomeComponent),
        canActivate: [roleGuard],
        data: { expectedRole: 'client' }
      },
      {
        path: 'home-doctor',
        loadComponent: () => import('./components/page/doctor-home/doctor-home.component').then(c => c.DoctorHomeComponent),
        canActivate: [roleGuard],
        data: { expectedRole: 'doctor' }
      },
      {
        path: 'search',
        loadComponent: () => import('./components/page/search/search.component').then(c => c.SearchComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/page/profile/profile.component').then(c => c.ProfileComponent)
      },
      {
        path: '',
        redirectTo: 'home-client',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];