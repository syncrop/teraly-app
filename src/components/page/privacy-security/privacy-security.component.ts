import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

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

  faceIdEnabled = signal<boolean>(false);
  twoFactorEnabled = signal<boolean>(true);
  showDeleteModal = signal<boolean>(false);

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
    const status = this.faceIdEnabled() ? 'activado' : 'desactivado';
    this.toastService.success(`Face ID ${status}`);
  }

  navigateToTwoFactor() {
    this.router.navigate(['/app/two-factor']);
  }

  navigateToCookies() {
    this.toastService.info('Función en desarrollo');
    // this.router.navigate(['/app/cookies']);
  }

  // TODO: Implementar gestión de dispositivos activos
  navigateToActiveDevices() {
    this.toastService.info('Función en desarrollo');
    // this.router.navigate(['/app/active-devices']);
  }

  showDeleteAccountModal() {
    this.showDeleteModal.set(true);
  }

  closeDeleteAccountModal() {
    this.showDeleteModal.set(false);
  }

  async deleteAccount() {
    this.toastService.info('Función en desarrollo - Eliminación de cuenta');
    this.closeDeleteAccountModal();
    // TODO: Implementar lógica para eliminar cuenta
    // 1. Confirmar con contraseña/autenticación
    // 2. Eliminar datos del usuario en Firestore
    // 3. Eliminar archivos del usuario en Storage
    // 4. Eliminar cuenta de Authentication
    // 5. Hacer logout y redirigir a login
  }
}
