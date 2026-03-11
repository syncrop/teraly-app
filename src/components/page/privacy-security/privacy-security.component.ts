import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { UsersApiService } from '../../../services/users-api.service';
import { isBackendEnabled } from '../../../config/backend.config';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-privacy-security',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-security.component.html'
})
export class PrivacySecurityComponent implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private usersApi = inject(UsersApiService);

  faceIdEnabled = signal<boolean>(false);
  twoFactorEnabled = signal<boolean>(true);
  showDeleteModal = signal<boolean>(false);
  isDeletingAccount = signal<boolean>(false);

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  goBack() {
    this.location.back();
  }

  navigateToChangePassword() {
    this.router.navigate(['/app/change-password']);
  }

  toggleFaceId() {
    this.faceIdEnabled.update(val => !val);
    const status = this.faceIdEnabled()
      ? $localize`:@@security.faceId.status.enabled:activado`
      : $localize`:@@security.faceId.status.disabled:desactivado`;
    this.toastService.success($localize`:@@toast.security.faceIdStatus:Face ID ${status}:status:`);
  }

  navigateToTwoFactor() {
    this.router.navigate(['/app/two-factor']);
  }

  navigateToCookies() {
    this.toastService.info($localize`:@@toast.common.featureInDevelopment:Función en desarrollo`);
    // this.router.navigate(['/app/cookies']);
  }

  // TODO: Implementar gestión de dispositivos activos
  navigateToActiveDevices() {
    this.toastService.info($localize`:@@toast.common.featureInDevelopment:Función en desarrollo`);
    // this.router.navigate(['/app/active-devices']);
  }

  showDeleteAccountModal() {
    this.showDeleteModal.set(true);
  }

  closeDeleteAccountModal() {
    this.showDeleteModal.set(false);
  }

  async deleteAccount() {
    if (this.isDeletingAccount()) return;

    const uid = this.authService.getCurrentUserId();
    if (!uid) {
      this.toastService.error(
        $localize`:@@toast.auth.sessionNotIdentified:No se pudo identificar tu sesión. Vuelve a iniciar sesión.`
      );
      return;
    }

    this.isDeletingAccount.set(true);

    try {
      if (!isBackendEnabled()) {
        this.toastService.error(
          $localize`:@@toast.account.deleteRequiresBackend:Eliminar cuenta requiere backend habilitado.`
        );
        return;
      }

      await firstValueFrom(this.usersApi.deleteMe());

      this.toastService.success($localize`:@@toast.account.deletedSuccess:Tu cuenta se eliminó correctamente`);
      this.closeDeleteAccountModal();
      await this.authService.logout();
    } catch (error) {
      console.error('Error deleting account:', error);
      this.toastService.error(
        $localize`:@@toast.account.deleteErrorRetry:No se pudo eliminar tu cuenta. Intenta de nuevo.`
      );
    } finally {
      this.isDeletingAccount.set(false);
    }
  }
}
