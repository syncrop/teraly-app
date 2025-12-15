import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Auth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from '@angular/fire/auth';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent implements OnInit {
  private location = inject(Location);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private auth = inject(Auth);

  isLoading = signal<boolean>(false);
  showCurrentPassword = signal<boolean>(false);
  showNewPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  goBack() {
    this.location.back();
  }

  toggleShowPassword(field: 'current' | 'new' | 'confirm') {
    switch(field) {
      case 'current':
        this.showCurrentPassword.update(val => !val);
        break;
      case 'new':
        this.showNewPassword.update(val => !val);
        break;
      case 'confirm':
        this.showConfirmPassword.update(val => !val);
        break;
    }
  }

  async changePassword() {
    if (this.passwordForm.invalid) {
      this.toastService.error('Por favor completa todos los campos correctamente');
      return;
    }

    const currentPassword = this.passwordForm.value.currentPassword!;
    const newPassword = this.passwordForm.value.newPassword!;
    const confirmPassword = this.passwordForm.value.confirmPassword!;

    // Validar que las nuevas contraseñas coincidan
    if (newPassword !== confirmPassword) {
      this.toastService.error('Las contraseñas nuevas no coinciden');
      return;
    }

    // Validar que la nueva contraseña sea diferente a la actual
    if (currentPassword === newPassword) {
      this.toastService.error('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    this.isLoading.set(true);

    try {
      const user = this.auth.currentUser;
      
      if (!user || !user.email) {
        this.toastService.error('No se pudo obtener el usuario actual');
        this.isLoading.set(false);
        return;
      }

      // Reautenticar al usuario con la contraseña actual
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      try {
        await reauthenticateWithCredential(user, credential);
      } catch (error: any) {
        console.error('Error al reautenticar:', error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          this.toastService.error('La contraseña actual es incorrecta');
        } else {
          this.toastService.error('Error al verificar la contraseña actual');
        }
        this.isLoading.set(false);
        return;
      }

      // Actualizar la contraseña
      await updatePassword(user, newPassword);
      
      this.toastService.success('Contraseña actualizada correctamente');
      this.passwordForm.reset();
      
      // Volver a la página anterior después de un breve delay
      setTimeout(() => {
        this.goBack();
      }, 1500);

    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      
      if (error.code === 'auth/weak-password') {
        this.toastService.error('La contraseña es demasiado débil');
      } else if (error.code === 'auth/requires-recent-login') {
        this.toastService.error('Por seguridad, debes volver a iniciar sesión');
        setTimeout(() => {
          this.authService.logout();
        }, 2000);
      } else {
        this.toastService.error('Error al cambiar la contraseña');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  get currentPasswordError(): string | null {
    const control = this.passwordForm.get('currentPassword');
    if (control?.hasError('required') && control?.touched) {
      return 'La contraseña actual es requerida';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Debe tener al menos 6 caracteres';
    }
    return null;
  }

  get newPasswordError(): string | null {
    const control = this.passwordForm.get('newPassword');
    if (control?.hasError('required') && control?.touched) {
      return 'La contraseña nueva es requerida';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Debe tener al menos 6 caracteres';
    }
    return null;
  }

  get confirmPasswordError(): string | null {
    const control = this.passwordForm.get('confirmPassword');
    if (control?.hasError('required') && control?.touched) {
      return 'Debes confirmar la contraseña';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Debe tener al menos 6 caracteres';
    }
    if (control?.value && control?.value !== this.passwordForm.get('newPassword')?.value && control?.touched) {
      return 'Las contraseñas no coinciden';
    }
    return null;
  }
}
