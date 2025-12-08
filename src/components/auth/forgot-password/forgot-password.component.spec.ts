import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../services/auth.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['resetPassword']);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with submitted as false', () => {
    expect(component.submitted()).toBe(false);
  });

  it('should initialize with isLoading as false', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('should initialize with null errorMessage', () => {
    expect(component.errorMessage()).toBeNull();
  });

  describe('Form Validation', () => {
    it('should mark form as invalid when empty', () => {
      expect(component.forgotPasswordForm.invalid).toBe(true);
    });

    it('should require email field', () => {
      const email = component.forgotPasswordForm.get('email');
      expect(email?.hasError('required')).toBe(true);
    });

    it('should validate email format', () => {
      const email = component.forgotPasswordForm.get('email');
      
      email?.setValue('invalid-email');
      expect(email?.hasError('email')).toBe(true);
      
      email?.setValue('valid@example.com');
      expect(email?.valid).toBe(true);
    });

    it('should mark form as valid with correct email', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      expect(component.forgotPasswordForm.valid).toBe(true);
    });
  });

  describe('isSubmittable', () => {
    it('should be false when form is invalid', () => {
      expect(component.isSubmittable()).toBe(false);
    });

    it('should be false when loading', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      component.isLoading.set(true);
      expect(component.isSubmittable()).toBe(false);
    });

    it('should be true when form is valid and not loading', (done) => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      // Wait for form status changes to propagate
      setTimeout(() => {
        expect(component.isSubmittable()).toBe(true);
        done();
      }, 100);
    });
  });

  describe('sendResetLink', () => {
    it('should not proceed if form is invalid', () => {
      spyOn(console, 'log');
      component.sendResetLink();
      expect(console.log).toHaveBeenCalledWith('Form is invalid');
      expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    });

    it('should mark form as touched when invalid', () => {
      component.sendResetLink();
      expect(component.forgotPasswordForm.get('email')?.touched).toBe(true);
    });

    it('should call authService.resetPassword with email', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: true }));

      component.sendResetLink();

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('test@example.com');
    });

    it('should set submitted to true on success', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: true }));

      component.sendResetLink();

      expect(component.submitted()).toBe(true);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
    });

    it('should set errorMessage on failure', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: false, error: 'User not found' }));

      component.sendResetLink();

      expect(component.submitted()).toBe(false);
      expect(component.errorMessage()).toBe('User not found');
      expect(component.isLoading()).toBe(false);
    });

    it('should set default error message when no error provided', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: false }));

      component.sendResetLink();

      expect(component.errorMessage()).toBe('Error al enviar el email de recuperación');
    });

    it('should handle observable errors', () => {
      spyOn(console, 'error');
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      mockAuthService.resetPassword.and.returnValue(throwError(() => new Error('Network error')));

      component.sendResetLink();

      expect(component.errorMessage()).toBe('Error al enviar el email. Intenta de nuevo.');
      expect(component.isLoading()).toBe(false);
      expect(component.submitted()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should clear errorMessage before new submission', () => {
      component.errorMessage.set('Previous error');
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: true }));

      component.sendResetLink();

      expect(mockAuthService.resetPassword).toHaveBeenCalled();
    });

    it('should not set submitted if error occurs', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: false, error: 'Invalid email' }));

      component.sendResetLink();

      expect(component.submitted()).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle email with special characters', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test+tag@example.co.uk'
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: true }));

      component.sendResetLink();

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('test+tag@example.co.uk');
    });

    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(50) + '@example.com';
      component.forgotPasswordForm.patchValue({
        email: longEmail
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: true }));

      component.sendResetLink();

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(longEmail);
    });

    it('should handle email with uppercase letters', () => {
      component.forgotPasswordForm.patchValue({
        email: 'Test@Example.COM'
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: true }));

      component.sendResetLink();

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('Test@Example.COM');
    });

    it('should handle whitespace in email', () => {
      component.forgotPasswordForm.patchValue({
        email: '  test@example.com  '
      });
      
      // Email with whitespace is invalid, so form should be invalid
      expect(component.forgotPasswordForm.invalid).toBe(true);
      expect(component.forgotPasswordForm.get('email')?.hasError('email')).toBe(true);
    });

    it('should handle multiple submission attempts', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      mockAuthService.resetPassword.and.returnValue(of({ success: true }));

      component.sendResetLink();
      expect(component.submitted()).toBe(true);

      // Try submitting again
      component.submitted.set(false);
      component.sendResetLink();
      
      expect(mockAuthService.resetPassword).toHaveBeenCalledTimes(2);
    });
  });
});
