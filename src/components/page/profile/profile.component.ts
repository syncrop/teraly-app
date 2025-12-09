import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';
import { ToastService } from '../../../services/toast.service';
import { ProfilePictureComponent } from './profile-picture/profile-picture.component';
import { DoctorProfileComponent } from './doctor-profile/doctor-profile.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProfilePictureComponent, DoctorProfileComponent]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  i18nService = inject(I18nService);
  private toastService = inject(ToastService);

  get isDoctor(): boolean {
    return this.authService.currentUserRole() === 'doctor';
  }

  get isProfileComplete(): boolean {
    return this.authService.currentUser()?.completed === true;
  }

  ngOnInit() {
    // Si es doctor, refrescar datos del perfil desde backend para verificar completed
    if (this.isDoctor) {
      this.authService.refreshUserData().subscribe({
        next: (userData) => {
          if (userData && !userData.completed) {
            this.toastService.info('Completa tu perfil profesional para empezar a ofrecer tus servicios');
          }
        },
        error: (error) => {
          console.error('Error al verificar estado del perfil:', error);
        }
      });
    }
  }

  logout() {
    this.toastService.info('Cerrando sesión...');
    this.authService.logout();
  }

  changeLanguage(langCode: string) {
    this.toastService.success('Idioma cambiado correctamente');
    this.i18nService.setLanguage(langCode);
  }

  editDoctorProfile() {
    this.router.navigate(['/app/edit-doctor-profile']);
  }
}
