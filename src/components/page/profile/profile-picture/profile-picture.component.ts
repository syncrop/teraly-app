import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-picture.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePictureComponent {
  private toastService = inject(ToastService);

  profileImage = signal<string | null>(null);
  userName = signal<string>('Alejandro García');
  userRole = signal<string>('Paciente');
  isLoading = signal<boolean>(false);

  constructor() {
    // Load user data from session/local storage
    const storedEmail = sessionStorage.getItem('email');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedEmail) {
      this.userName.set(storedEmail.split('@')[0]);
    }
    
    if (storedRole) {
      this.userRole.set(storedRole === 'client' ? 'Paciente' : 'Especialista');
    }

    // Load profile image from localStorage if exists
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      this.profileImage.set(savedImage);
    }
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

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('La imagen no puede superar los 5MB');
        return;
      }

      this.isLoading.set(true);

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result as string;
        this.profileImage.set(result);
        localStorage.setItem('profileImage', result);
        this.isLoading.set(false);
        this.toastService.success('Foto de perfil actualizada');
      };

      reader.onerror = () => {
        this.isLoading.set(false);
        this.toastService.error('Error al cargar la imagen');
      };

      reader.readAsDataURL(file);
    }
  }

  removeProfilePicture() {
    this.profileImage.set(null);
    localStorage.removeItem('profileImage');
    this.toastService.info('Foto de perfil eliminada');
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
