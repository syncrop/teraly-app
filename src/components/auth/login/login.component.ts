import { ChangeDetectionStrategy, Component, computed, inject, signal, NgZone } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LogoComponent } from '../../shared/logo/logo.component';
import { AuthService } from '../../../services/auth.service';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthLayoutComponent]
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  private formStatus = toSignal(this.loginForm.statusChanges, { initialValue: this.loginForm.status });
  isSubmittable = computed(() => this.formStatus() === 'VALID' && !this.isLoading());

  login() {
console.log('Login form submitted');
    if (this.loginForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    
    this.authService.login(email!, password!).subscribe({
      next: (result) => {
        console.log('Login result:', result);
        this.isLoading.set(false);
        
        if (result.success) {
          this.toastService.success('¡Bienvenido! Inicio de sesión exitoso');
          const role = this.authService.currentUserRole();
          const currentUser = this.authService.currentUser();
          
          console.log('User role:', role);
          console.log('Current user:', currentUser);
          
          if (role === 'client') {
            console.log('Navigating to client home');
            this.router.navigate(['/app/home-client']).then(success => {
              console.log('Navigation success:', success);
            });
          } else if (role === 'doctor') {
            // Check if doctor profile is complete
            const isProfileComplete = currentUser?.completed === true;
            console.log('Is profile complete:', isProfileComplete);
            
            if (!isProfileComplete) {
              console.log('Navigating to profile');
              this.router.navigate(['/app/profile']).then(success => {
                console.log('Navigation success:', success);
              });
              this.toastService.show('Por favor, completa tu perfil para comenzar', 'info');
            } else {
              console.log('Navigating to doctor home');
              this.router.navigate(['/app/home-doctor']).then(success => {
                console.log('Navigation success:', success);
              });
            }
          } else {
            console.log('Unknown role:', role);
          }
        } else {
          console.log('Login failed:', result.error);
          this.errorMessage.set(result.error || 'Error al iniciar sesión');
          this.toastService.error(result.error || 'Error al iniciar sesión');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al iniciar sesión. Intenta de nuevo.');
        this.toastService.error('Error al iniciar sesión. Intenta de nuevo.');
        console.error('Login error:', error);
      }
    });
  }
}
