import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LogoComponent } from '../../shared/logo/logo.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent]
})
export class LoginComponent {
  private router = inject(Router);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  private formStatus = toSignal(this.loginForm.statusChanges, { initialValue: this.loginForm.status });
  isSubmittable = computed(() => this.formStatus() === 'VALID');

  login() {
    if (this.loginForm.valid) {
      console.log('Login successful', this.loginForm.value);
      // In a real app, you would navigate to a dashboard
      // this.router.navigate(['/dashboard']);
    } else {
      console.log('Form is invalid');
    }
  }
}
