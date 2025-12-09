import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { I18nService } from '../../../../services/i18n.service';
import { ProfilePictureComponent } from '../profile-picture/profile-picture.component';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, ProfilePictureComponent],
  templateUrl: './doctor-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private i18nService = inject(I18nService);

  isAvailable = signal(true);
  showProfilePictureModal = signal(false);

  get currentUser() {
    return this.authService.currentUser();
  }

  get isProfileComplete(): boolean {
    return this.currentUser?.completed === true;
  }

  get availableLanguages() {
    return this.i18nService.availableLanguages;
  }

  get currentLanguage() {
    return this.i18nService.currentLang();
  }

  getInitials(): string {
    const user = this.currentUser;
    if (!user?.fullName) return 'PA';
    
    const names = user.fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  get earnings() {
    // Mock data - should come from backend
    return '2.450€';
  }

  get appointmentsCount() {
    // Mock data - should come from backend
    return 42;
  }

  get rating() {
    // Mock data - should come from backend
    return 4.9;
  }

  get price() {
    const user = this.currentUser;
    return (user as any)?.price || 50;
  }

  get newReviewsCount() {
    // Mock data - should come from backend
    return 3;
  }

  toggleAvailability() {
    this.isAvailable.update(val => !val);
    const status = this.isAvailable() ? 'disponible' : 'no disponible';
    this.toastService.success(`Estado cambiado a ${status}`);
  }

  navigateToSchedule() {
    this.toastService.info('Función en desarrollo');
    // this.router.navigate(['/app/schedule']);
  }

  navigateToEditProfile() {
    this.router.navigate(['/app/edit-doctor-profile']);
  }

  navigateToPayments() {
    this.toastService.info('Función en desarrollo');
    // this.router.navigate(['/app/payments']);
  }

  navigateToReviews() {
    this.toastService.info('Función en desarrollo');
    // this.router.navigate(['/app/reviews']);
  }

  changeLanguage(langCode: string) {
    this.toastService.success('Idioma cambiado correctamente');
    this.i18nService.setLanguage(langCode);
  }

  openProfilePictureModal() {
    this.showProfilePictureModal.set(true);
  }

  closeProfilePictureModal() {
    this.showProfilePictureModal.set(false);
  }

  logout() {
    this.toastService.info('Cerrando sesión...');
    this.authService.logout();
  }
}
