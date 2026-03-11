import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LogoComponent } from '../../shared/logo/logo.component';
import { AuthService } from '../../../services/auth.service';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthLayoutComponent],
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  submitted = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  private formStatus = toSignal(this.forgotPasswordForm.statusChanges, { initialValue: this.forgotPasswordForm.status });
  isSubmittable = computed(() => this.formStatus() === 'VALID' && !this.isLoading());

  sendResetLink() {
    if (this.forgotPasswordForm.invalid) {
      console.log('Form is invalid');
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = this.forgotPasswordForm.value.email!;
    
    this.authService.resetPassword(email).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        
        if (result.success) {
          this.submitted.set(true);
          this.toastService.success(
            $localize`:@@toast.auth.resetEmailSent:Email de recuperación enviado. Revisa tu bandeja`
          );
        } else {
          const fallback = $localize`:@@toast.auth.resetEmailError:Error al enviar el email de recuperación`;
          this.errorMessage.set(result.error || fallback);
          this.toastService.error(result.error || fallback);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = $localize`:@@toast.auth.resetEmailErrorRetry:Error al enviar el email. Intenta de nuevo.`;
        this.errorMessage.set(message);
        this.toastService.error(message);
        console.error('Password reset error:', error);
      }
    });
  }
}
