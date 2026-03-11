import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';
import { LanguagesSelectorComponent } from '../../shared/languages-selector/languages-selector.component';

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
  standalone: true,
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthLayoutComponent, CommonModule, LanguagesSelectorComponent]
})
export class RegisterComponent implements OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  userType = signal<'client' | 'doctor'>('client');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  private _subscriptions = new Subscription();

  registerForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required),
    languages: new FormControl<string[]>([], Validators.required)
  }, { validators: passwordMatchValidator('password', 'confirmPassword') });

  formStatus = signal(this.registerForm.status);
  isSubmittable = computed(() => this.formStatus() === 'VALID' && !this.isLoading());

  constructor() {
    // initialize formStatus and subscribe to statusChanges so the computed updates
    this.formStatus.set(this.registerForm.status);
    const statusSub = this.registerForm.statusChanges.subscribe(status => this.formStatus.set(status));
    this._subscriptions.add(statusSub);

    // re-subscribe to control valueChanges to react to input updates (helps debugging)
    Object.entries(this.registerForm.controls).forEach(([name, control]) => {
      const sub = (control as any).valueChanges.subscribe((value: any) => {
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

    const { email, password, fullName, languages } = this.registerForm.value;
    
    this.authService.register(
      email!, 
      password!, 
      fullName!,
      this.userType(),
      undefined,
      languages || []
    ).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        
        if (result.success) {
          this.toastService.success($localize`:@@toast.auth.registerSuccess:¡Registro exitoso!`);
          
          // Auto-login after registration
          this.authService.login(email!, password!).subscribe({
            next: (loginResult) => {
              if (loginResult.success) {
                const role = this.authService.currentUserRole();
                
                if (role === 'client') {
                  this.router.navigate(['/app/home-client']);
                } else if (role === 'doctor') {
                  // Redirect doctor to profile to complete information
                  this.router.navigate(['/app/profile']);
                  this.toastService.show(
                    $localize`:@@toast.auth.completeProfileToOfferServices:Por favor, completa tu perfil para poder ofrecer tus servicios`,
                    'info'
                  );
                }
              } else {
                // Fallback to login page if auto-login fails
                this.router.navigate(['/login']);
              }
            },
            error: () => {
              // Fallback to login page if auto-login fails
              this.router.navigate(['/login']);
            }
          });
        } else {
          const fallback = $localize`:@@toast.auth.registerError:Error al registrarse`;
          this.errorMessage.set(result.error || fallback);
          this.toastService.error(result.error || fallback);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = $localize`:@@toast.auth.registerErrorRetry:Error al registrarse. Intenta de nuevo.`;
        this.errorMessage.set(message);
        this.toastService.error(message);
        console.error('Register error:', error);
      }
    });
  }
}
