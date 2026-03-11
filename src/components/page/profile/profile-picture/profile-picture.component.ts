import { ChangeDetectionStrategy, Component, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../services/toast.service';
import { StorageService } from '../../../../services/storage.service';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { CameraService } from '../../../../services/camera.service';
import { Capacitor } from '@capacitor/core';

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
  private cameraService = inject(CameraService);

  profileImage = signal<string | null>(null);
  userName = signal<string>('Usuario');
  userRole = signal<string>('Paciente');
  isLoading = signal<boolean>(false);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

  handleCameraClick() {
    if (this.isLoading()) return;

    // En plataformas nativas, usar el servicio de cámara directamente
    if (Capacitor.isNativePlatform()) {
      this.onFileSelected();
    } else {
      // En web, abrir el input file
      this.fileInput?.nativeElement.click();
    }
  }

  async onFileSelected(event?: Event) {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.toastService.error($localize`:@@toast.common.userNotFound:Usuario no encontrado`);
      return;
    }

    this.isLoading.set(true);

    try {
      // En plataformas nativas, usar el plugin de cámara
      if (Capacitor.isNativePlatform()) {
        const photo = await this.cameraService.selectPhoto();
        
        if (!photo) {
          this.isLoading.set(false);
          return;
        }

        // Convertir dataUrl a blob
        let blob: Blob;
        
        if (photo.dataUrl) {
          // Convertir base64 a blob
          const base64Response = await fetch(photo.dataUrl);
          blob = await base64Response.blob();
        } else if (photo.webPath) {
          // Si por alguna razón tenemos webPath
          const response = await fetch(photo.webPath);
          blob = await response.blob();
        } else {
          this.isLoading.set(false);
          this.toastService.error($localize`:@@toast.profile.imageProcessError:No se pudo procesar la imagen`);
          return;
        }
        
        // Validar que el blob no esté vacío
        if (blob.size === 0) {
          this.isLoading.set(false);
          this.toastService.error($localize`:@@toast.profile.imageEmpty:La imagen seleccionada está vacía`);
          return;
        }
        
        // Crear un File desde el blob
        const fileName = `profile_${userId}_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        // Subir imagen
        this.uploadImage(file, userId);
      } else {
        // En web, usar el input file tradicional
        const input = event?.target as HTMLInputElement;
        if (!input?.files?.[0]) {
          this.isLoading.set(false);
          return;
        }

        const file = input.files[0];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          this.toastService.error($localize`:@@profile.invalidImage:Por favor selecciona un archivo de imagen válido`);
          this.isLoading.set(false);
          return;
        }

        // Validate file size (max 8MB)
        if (file.size > 8 * 1024 * 1024) {
          this.toastService.error($localize`:@@toast.profile.imageTooLarge8mb:La imagen no puede superar los 8MB`);
          this.isLoading.set(false);
          return;
        }

        this.uploadImage(file, userId);
      }
    } catch (error) {
      this.isLoading.set(false);
      this.toastService.error($localize`:@@toast.profile.imageSelectError:Error al seleccionar la imagen`);
    }
  }

  private uploadImage(file: File, userId: string) {
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
              this.toastService.success($localize`:@@profile.photoUpdated:Foto de perfil actualizada`);
            } else {
              this.isLoading.set(false);
              this.toastService.error($localize`:@@toast.profile.savePhotoError:Error al guardar la foto de perfil`);
            }
          },
          error: () => {
            this.isLoading.set(false);
            this.toastService.error($localize`:@@toast.profile.updateError:Error al actualizar el perfil`);
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error($localize`:@@toast.profile.uploadImageError:Error al subir la imagen`);
      }
    });
  }

  removeProfilePicture() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.toastService.error($localize`:@@toast.common.userNotFound:Usuario no encontrado`);
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
          this.toastService.info($localize`:@@profile.photoRemoved:Foto de perfil eliminada`);
        } else {
          this.isLoading.set(false);
          this.toastService.error($localize`:@@toast.profile.removePhotoError:Error al eliminar la foto de perfil`);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error($localize`:@@toast.profile.removePhotoGenericError:Error al eliminar la foto`);
      }
    });
  }

  triggerFileInput() {
    const name = this.userName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getInitials(): string {
    return this.triggerFileInput();
  }
}
