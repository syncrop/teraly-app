import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LogoComponent } from '../../shared/logo/logo.component';
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

  userType = signal<'patient' | 'specialist'>('patient');

  registerForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required),
    licenseNumber: new FormControl('')
  }, { validators: passwordMatchValidator('password', 'confirmPassword') });

  private formStatus = toSignal(this.registerForm.statusChanges, { initialValue: this.registerForm.status });
  isSubmittable = computed(() => this.formStatus() === 'VALID');

  constructor() {
    effect(() => {
      const licenseControl = this.registerForm.get('licenseNumber');
      if (this.userType() === 'specialist') {
        licenseControl?.setValidators([Validators.required]);
      } else {
        licenseControl?.clearValidators();
      }
      licenseControl?.updateValueAndValidity();
    });
  }

  toggleUserType() {
    this.userType.update(current => current === 'patient' ? 'specialist' : 'patient');
  }

  register() {
    if (this.registerForm.valid) {
      console.log('Registration successful for', this.userType(), this.registerForm.value);
      this.router.navigate(['/login']);
    } else {
      console.log('Form is invalid');
      this.registerForm.markAllAsTouched();
    }
  }
}
