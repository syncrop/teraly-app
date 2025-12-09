import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

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
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthLayoutComponent, CommonModule]
})
export class RegisterComponent implements OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  userType = signal<'client' | 'doctor'>('client');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showLanguagesDropdown = signal(false);
  private _subscriptions = new Subscription();

  availableLanguages = [
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'pl', flag: '🇵🇱', name: 'Polski' },
    { code: 'uk', flag: '🇺🇦', name: 'Українська' },
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'pt', flag: '🇵🇹', name: 'Português' }
  ];

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

  toggleLanguagesDropdown() {
    this.showLanguagesDropdown.update(val => !val);
  }

  toggleLanguage(languageCode: string) {
    const currentLanguages = this.registerForm.get('languages')?.value || [];
    const index = currentLanguages.indexOf(languageCode);
    
    if (index > -1) {
      // Remove language
      const newLanguages = currentLanguages.filter(code => code !== languageCode);
      this.registerForm.get('languages')?.setValue(newLanguages);
    } else {
      // Add language
      this.registerForm.get('languages')?.setValue([...currentLanguages, languageCode]);
    }
  }

  isLanguageSelected(languageCode: string): boolean {
    const currentLanguages = this.registerForm.get('languages')?.value || [];
    return currentLanguages.includes(languageCode);
  }

  getSelectedLanguagesDisplay(): string {
    const currentLanguages = this.registerForm.get('languages')?.value || [];
    if (currentLanguages.length === 0) return 'Selecciona idiomas';
    
    const selectedLangs = this.availableLanguages
      .filter(lang => currentLanguages.includes(lang.code))
      .map(lang => `${lang.flag} ${lang.name}`);
    
    return selectedLangs.join(', ');
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
          this.toastService.success('¡Registro exitoso!');
          
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
                  this.toastService.show('Por favor, completa tu perfil para poder ofrecer tus servicios', 'info');
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
          this.errorMessage.set(result.error || 'Error al registrarse');
          this.toastService.error(result.error || 'Error al registrarse');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al registrarse. Intenta de nuevo.');
        this.toastService.error('Error al registrarse. Intenta de nuevo.');
        console.error('Register error:', error);
      }
    });
  }
}
