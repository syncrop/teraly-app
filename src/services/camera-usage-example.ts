// Ejemplo de uso en un componente de perfil

import { Component, inject } from '@angular/core';
import { CameraService } from '../../services/camera.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  template: `
    <button (click)="changeProfilePicture()">
      Cambiar foto de perfil
    </button>
  `
})
export class ProfileExampleComponent {
  private cameraService = inject(CameraService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  async changeProfilePicture() {
    try {
      // Mostrar opciones: Cámara o Galería
      const photo = await this.cameraService.selectPhoto();
      
      if (!photo) {
        return; // Usuario canceló
      }

      // Convertir a base64 para subirlo
      const base64 = await this.cameraService.photoToBase64(photo);
      
      if (!base64) {
        this.toastService.error('Error al procesar la imagen');
        return;
      }

      // Subir a Firebase Storage usando UserService
      const userId = 'current-user-id'; // Obtener del AuthService
      await this.userService.updateProfilePicture(userId, base64);
      
      this.toastService.success('Foto de perfil actualizada');
      
    } catch (error) {
      console.error('Error al cambiar foto:', error);
      this.toastService.error('Error al actualizar la foto');
    }
  }
}
