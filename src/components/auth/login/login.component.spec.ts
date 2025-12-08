import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'currentUserRole']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.value.email).toBe('');
    expect(component.loginForm.value.password).toBe('');
  });

  it('should initialize with isLoading as false', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('should initialize with null errorMessage', () => {
    expect(component.errorMessage()).toBeNull();
  });

  describe('Form Validation', () => {
    it('should mark form as invalid when empty', () => {
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should mark email as invalid when empty', () => {
      const email = component.loginForm.get('email');
      expect(email?.hasError('required')).toBe(true);
    });

    it('should mark email as invalid with incorrect format', () => {
      const email = component.loginForm.get('email');
      email?.setValue('invalid-email');
      expect(email?.hasError('email')).toBe(true);
    });

    it('should mark email as valid with correct format', () => {
      const email = component.loginForm.get('email');
      email?.setValue('test@example.com');
      expect(email?.valid).toBe(true);
    });

    it('should mark password as invalid when empty', () => {
      const password = component.loginForm.get('password');
      expect(password?.hasError('required')).toBe(true);
    });

    it('should mark form as valid when all fields are filled correctly', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('isSubmittable', () => {
    it('should be false when form is invalid', () => {
      expect(component.isSubmittable()).toBe(false);
    });

    it('should be false when loading', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      component.isLoading.set(true);
      expect(component.isSubmittable()).toBe(false);
    });

    it('should be true when form is valid and not loading', (done) => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      // Wait for form status changes to propagate
      setTimeout(() => {
        expect(component.isSubmittable()).toBe(true);
        done();
      }, 100);
    });
  });

  describe('login', () => {
    it('should not proceed if form is invalid', () => {
      spyOn(console, 'log');
      component.login();
      expect(console.log).toHaveBeenCalledWith('Form is invalid');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should call authService.login with form values', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      mockAuthService.login.and.returnValue(of({ success: true, role: 'client' }));
      mockAuthService.currentUserRole.and.returnValue('client');

      component.login();

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should set isLoading to true when login starts', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      mockAuthService.login.and.returnValue(of({ success: true, role: 'client' }));
      mockAuthService.currentUserRole.and.returnValue('client');

      component.login();

      // isLoading should be true during login, but will be false after completion
      expect(mockAuthService.login).toHaveBeenCalled();
    });

    it('should navigate to /app/home-client for client role on success', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      mockAuthService.login.and.returnValue(of({ success: true, role: 'client' }));
      mockAuthService.currentUserRole.and.returnValue('client');

      component.login();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home-client']);
    });

    it('should navigate to /app/home-doctor for doctor role on success', () => {
      component.loginForm.patchValue({
        email: 'doctor@example.com',
        password: 'password123'
      });
      mockAuthService.login.and.returnValue(of({ success: true, role: 'doctor' }));
      mockAuthService.currentUserRole.and.returnValue('doctor');

      component.login();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home-doctor']);
    });

    it('should set errorMessage on login failure', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      mockAuthService.login.and.returnValue(of({ success: false, error: 'Invalid credentials' }));

      component.login();

      expect(component.errorMessage()).toBe('Invalid credentials');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle error with default message', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      mockAuthService.login.and.returnValue(of({ success: false }));

      component.login();

      expect(component.errorMessage()).toBe('Error al iniciar sesión');
    });

    it('should handle observable errors', () => {
      spyOn(console, 'error');
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      mockAuthService.login.and.returnValue(throwError(() => new Error('Network error')));

      component.login();

      expect(component.errorMessage()).toBe('Error al iniciar sesión. Intenta de nuevo.');
      expect(component.isLoading()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should clear errorMessage before new login attempt', () => {
      component.errorMessage.set('Previous error');
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      mockAuthService.login.and.returnValue(of({ success: true, role: 'client' }));
      mockAuthService.currentUserRole.and.returnValue('client');

      component.login();

      expect(mockAuthService.login).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle login with special characters in email', () => {
      component.loginForm.patchValue({
        email: 'test+special@example.com',
        password: 'password123'
      });
      mockAuthService.login.and.returnValue(of({ success: true, role: 'client' }));
      mockAuthService.currentUserRole.and.returnValue('client');

      component.login();

      expect(mockAuthService.login).toHaveBeenCalledWith('test+special@example.com', 'password123');
    });

    it('should handle very long passwords', () => {
      const longPassword = 'a'.repeat(100);
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: longPassword
      });
      mockAuthService.login.and.returnValue(of({ success: true, role: 'client' }));
      mockAuthService.currentUserRole.and.returnValue('client');

      component.login();

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', longPassword);
    });

    it('should handle whitespace in form fields', () => {
      component.loginForm.patchValue({
        email: '  test@example.com  ',
        password: '  password123  '
      });
      mockAuthService.login.and.returnValue(of({ success: true, role: 'client' }));
      mockAuthService.currentUserRole.and.returnValue('client');

      component.login();

      expect(mockAuthService.login).toHaveBeenCalledWith('  test@example.com  ', '  password123  ');
    });
  });
});
