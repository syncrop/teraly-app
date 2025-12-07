import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LogoComponent } from '../../shared/logo/logo.component';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthLayoutComponent],
})
export class ForgotPasswordComponent {
  submitted = signal(false);

  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  private formStatus = toSignal(this.forgotPasswordForm.statusChanges, { initialValue: this.forgotPasswordForm.status });
  isSubmittable = computed(() => this.formStatus() === 'VALID');

  sendResetLink() {
    if (this.forgotPasswordForm.valid) {
      console.log('Password reset link sent to:', this.forgotPasswordForm.value.email);
      this.submitted.set(true);
    } else {
      console.log('Form is invalid');
      this.forgotPasswordForm.markAllAsTouched();
    }
  }
}
