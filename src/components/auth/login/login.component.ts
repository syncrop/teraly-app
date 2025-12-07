import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LogoComponent } from '../../shared/logo/logo.component';
import { AuthService } from '../../../services/auth.service';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthLayoutComponent]
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  private formStatus = toSignal(this.loginForm.statusChanges, { initialValue: this.loginForm.status });
  isSubmittable = computed(() => this.formStatus() === 'VALID');

  login() {
    if (this.loginForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    const { email, password } = this.loginForm.value;
    const isLoggedIn = this.authService.login(email!, password!);

    if (isLoggedIn) {
      const role = this.authService.currentUserRole();
      if (role === 'client') {
        this.router.navigate(['/app/home-client']);
      } else if (role === 'doctor') {
        this.router.navigate(['/app/home-doctor']);
      } else {
        this.router.navigate(['/login']);
      }
    } else {
      this.loginForm.setErrors({ invalidCredentials: true });
    }
  }
}
