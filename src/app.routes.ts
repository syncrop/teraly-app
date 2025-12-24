
import { Routes } from '@angular/router';
import { accessGuard } from './guards/access.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(c => c.LoginComponent),
    canActivate: [accessGuard],
    data: { noAuth: true }
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(c => c.RegisterComponent),
    canActivate: [accessGuard],
    data: { noAuth: true }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
    canActivate: [accessGuard],
    data: { noAuth: true }
  },
  {
    path: 'app',
    loadComponent: () => import('./components/page/page.component').then(c => c.PageComponent),
    canActivate: [accessGuard],
    children: [
      {
        path: 'home-client',
        loadComponent: () => import('./components/page/client-home/client-home.component').then(c => c.ClientHomeComponent),
        canActivate: [accessGuard],
        data: { expectedRole: 'client' }
      },
      {
        path: 'home-doctor',
        loadComponent: () => import('./components/page/doctor-home/doctor-home.component').then(c => c.DoctorHomeComponent),
        canActivate: [accessGuard],
        data: { expectedRole: 'doctor' }
      },
      {
        path: 'search',
        loadComponent: () => import('./components/page/search/search.component').then(c => c.SearchComponent)
      },
      {
        path: 'doctor/:id',
        loadComponent: () => import('./components/page/doctor-detail/doctor-detail.component').then(c => c.DoctorDetailComponent)
      },
      {
        path: 'favorites',
        loadComponent: () => import('./components/page/favorites/favorites.component').then(c => c.FavoritesComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/page/profile/profile.component').then(c => c.ProfileComponent)
      },
      {
        path: 'edit-doctor-profile',
        loadComponent: () => import('./components/page/profile/edit-doctor-profile/edit-doctor-profile.component').then(c => c.EditDoctorProfileComponent),
        canActivate: [accessGuard],
        data: { expectedRole: 'doctor' }
      },
      {
        path: 'help-support',
        loadComponent: () => import('./components/page/help-support/help-support.component').then(c => c.HelpSupportComponent)
      },
      {
        path: 'availability',
        loadComponent: () => import('./components/page/availability/availability.component').then(c => c.AvailabilityComponent),
        canActivate: [accessGuard],
        data: { expectedRole: 'doctor' }
      },
      {
        path: 'calendar',
        loadComponent: () => import('./components/page/calendar/calendar.component').then(c => c.CalendarComponent),
        canActivate: [accessGuard],
        data: { expectedRole: 'doctor' }
      },
      {
        path: 'patients',
        loadComponent: () => import('./components/page/patients/patients.component').then(c => c.PatientsComponent),
        canActivate: [accessGuard],
        data: { expectedRole: 'doctor' }
      },
      {
        path: 'appointments',
        loadComponent: () => import('./components/page/appointments/appointments.component').then(c => c.AppointmentsComponent),
        canActivate: [accessGuard],
        data: { expectedRole: 'client' }
      },
      {
        path: 'video-call/:id',
        loadComponent: () => import('./components/page/video-call/video-call.component').then(c => c.VideoCallComponent)
      },
      {
        path: 'privacy-security',
        loadComponent: () => import('./components/page/privacy-security/privacy-security.component').then(c => c.PrivacySecurityComponent)
      },
      {
        path: 'two-factor',
        loadComponent: () => import('./components/page/two-factor/two-factor.component').then(c => c.TwoFactorComponent)
      },
      {
        path: 'change-password',
        loadComponent: () => import('./components/page/change-password/change-password.component').then(c => c.ChangePasswordComponent)
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