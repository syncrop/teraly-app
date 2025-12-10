import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../services/toast.service';
import { StorageService } from '../../../../services/storage.service';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-picture.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePictureComponent implements OnInit {
  private toastService = inject(ToastService);
  private storageService = inject(StorageService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  profileImage = signal<string | null>(null);
  userName = signal<string>('Usuario');
  userRole = signal<string>('Paciente');
  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData() {
    this.authService.getCurrentUser().subscribe({
      next: (currentUser) => {
        if (currentUser) {
          this.userName.set(currentUser.fullName || currentUser.email || 'Usuario');
          this.userRole.set(currentUser.role === 'client' ? 'Paciente' : 'Especialista');
          
          // Cargar foto de perfil desde el usuario actual
          if (currentUser.photoURL) {
            this.profileImage.set(currentUser.photoURL);
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar datos del usuario:', error);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validate file size (max 8MB)
      if (file.size > 8 * 1024 * 1024) {
        this.toastService.error('La imagen no puede superar los 8MB');
        return;
      }

      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        this.toastService.error('Usuario no encontrado');
        return;
      }

      this.isLoading.set(true);

      // Subir imagen a Firebase Storage
      this.storageService.uploadProfilePicture(file, userId).subscribe({
        next: (downloadURL) => {
          // Actualizar photoURL en Firestore
          this.userService.updateProfilePicture(userId, downloadURL).subscribe({
            next: (success) => {
              if (success) {
                this.profileImage.set(downloadURL);
                
                // Actualizar el usuario en el AuthService
                this.userService.refreshUserData(userId).subscribe({
                  next: (userData) => {
                    if (userData) {
                      this.authService.currentUser.set(userData);
                    }
                  }
                });
                
                this.isLoading.set(false);
                this.toastService.success('Foto de perfil actualizada');
              } else {
                this.isLoading.set(false);
                this.toastService.error('Error al guardar la foto de perfil');
              }
            },
            error: () => {
              this.isLoading.set(false);
              this.toastService.error('Error al actualizar el perfil');
            }
          });
        },
        error: () => {
          this.isLoading.set(false);
          this.toastService.error('Error al subir la imagen');
        }
      });
    }
  }

  removeProfilePicture() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.toastService.error('Usuario no encontrado');
      return;
    }

    const currentPhotoURL = this.profileImage();
    
    this.isLoading.set(true);

    // Eliminar de Firestore
    this.userService.removeProfilePicture(userId).subscribe({
      next: (success) => {
        if (success) {
          // Si había una imagen en Storage, intentar eliminarla
          if (currentPhotoURL && currentPhotoURL.includes('firebase')) {
            this.storageService.deleteProfilePicture(currentPhotoURL).subscribe({
              next: () => console.log('Imagen eliminada de Storage'),
              error: (error) => console.error('Error al eliminar imagen de Storage:', error)
            });
          }
          
          this.profileImage.set(null);
          
          // Actualizar el usuario en el AuthService
          this.userService.refreshUserData(userId).subscribe({
            next: (userData) => {
              if (userData) {
                this.authService.currentUser.set(userData);
              }
            }
          });
          
          this.isLoading.set(false);
          this.toastService.info('Foto de perfil eliminada');
        } else {
          this.isLoading.set(false);
          this.toastService.error('Error al eliminar la foto de perfil');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Error al eliminar la foto');
      }
    });
  }

  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  getInitials(): string {
    const name = this.userName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
