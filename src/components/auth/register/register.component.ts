import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { CommonModule } from '@angular/common';
import { passwordMatchValidator } from '../../../validators/password-validators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthLayoutComponent, CommonModule]
})
export class RegisterComponent implements OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);

  userType = signal<'client' | 'doctor'>('client');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  private _subscriptions = new Subscription();

  registerForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required),
    licenseNumber: new FormControl('')
  }, { validators: passwordMatchValidator('password', 'confirmPassword') });

  formStatus = signal(this.registerForm.status);
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
    // initialize formStatus and subscribe to statusChanges so the computed updates
    this.formStatus.set(this.registerForm.status);
    const statusSub = this.registerForm.statusChanges.subscribe(status => this.formStatus.set(status));
    this._subscriptions.add(statusSub);

    // re-subscribe to control valueChanges to react to input updates (helps debugging)
    Object.entries(this.registerForm.controls).forEach(([name, control]) => {
      const sub = control.valueChanges.subscribe(value => {
        console.log(`[Register] ${name} changed:`, value);
      });
      this._subscriptions.add(sub);
    });
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
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
