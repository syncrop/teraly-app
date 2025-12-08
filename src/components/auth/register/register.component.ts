import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LogoComponent } from '../../shared/logo/logo.component';
import { AuthService } from '../../../services/auth.service';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';

function passwordMatchValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (formGroup: AbstractControl) => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);
    if (matchingControl?.errors && !matchingControl.errors['passwordMismatch']) {
      return null;
    }
    if (control?.value !== matchingControl?.value) {
      matchingControl?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      matchingControl?.setErrors(null);
      return null;
    }
  };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthLayoutComponent]
})
export class RegisterComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  userType = signal<'client' | 'doctor'>('client');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  registerForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required),
    licenseNumber: new FormControl('')
  }, { validators: passwordMatchValidator('password', 'confirmPassword') });

  private formStatus = toSignal(this.registerForm.statusChanges, { initialValue: this.registerForm.status });
  isSubmittable = computed(() => this.formStatus() === 'VALID' && !this.isLoading());

  constructor() {
    effect(() => {
      const licenseControl = this.registerForm.get('licenseNumber');
      if (this.userType() === 'doctor') {
        licenseControl?.setValidators([Validators.required]);
      } else {
        licenseControl?.clearValidators();
      }
      licenseControl?.updateValueAndValidity();
    });
  }

  toggleUserType() {
    this.userType.update(current => current === 'client' ? 'doctor' : 'client');
  }

  register() {
    if (this.registerForm.invalid) {
      console.log('Form is invalid');
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password, fullName, licenseNumber } = this.registerForm.value;
    
    this.authService.register(
      email!, 
      password!, 
      fullName!,
      this.userType(),
      licenseNumber || undefined
    ).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        
        if (result.success) {
          this.router.navigate(['/login']);
        } else {
          this.errorMessage.set(result.error || 'Error al registrarse');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al registrarse. Intenta de nuevo.');
        console.error('Register error:', error);
      }
    });
  }
}
