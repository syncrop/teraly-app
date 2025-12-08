import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['register']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with userType as client', () => {
    expect(component.userType()).toBe('client');
  });

  it('should initialize with isLoading as false', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('should initialize with null errorMessage', () => {
    expect(component.errorMessage()).toBeNull();
  });

  describe('Form Validation', () => {
    it('should mark form as invalid when empty', () => {
      expect(component.registerForm.invalid).toBe(true);
    });

    it('should require fullName', () => {
      const fullName = component.registerForm.get('fullName');
      expect(fullName?.hasError('required')).toBe(true);
    });

    it('should require email and validate format', () => {
      const email = component.registerForm.get('email');
      expect(email?.hasError('required')).toBe(true);
      
      email?.setValue('invalid-email');
      expect(email?.hasError('email')).toBe(true);
      
      email?.setValue('valid@example.com');
      expect(email?.valid).toBe(true);
    });

    it('should require password with minimum 8 characters', () => {
      const password = component.registerForm.get('password');
      expect(password?.hasError('required')).toBe(true);
      
      password?.setValue('short');
      expect(password?.hasError('minLength')).toBe(true);
      
      password?.setValue('validpassword');
      expect(password?.valid).toBe(true);
    });

    it('should require confirmPassword', () => {
      const confirmPassword = component.registerForm.get('confirmPassword');
      expect(confirmPassword?.hasError('required')).toBe(true);
    });

    it('should validate password matching', () => {
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different'
      });
      
      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    });

    it('should be valid when passwords match', () => {
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
      expect(component.registerForm.valid).toBe(true);
    });

    it('should require licenseNumber when userType is doctor', () => {
      component.userType.set('doctor');
      fixture.detectChanges();
      
      const licenseNumber = component.registerForm.get('licenseNumber');
      expect(licenseNumber?.hasError('required')).toBe(true);
      
      licenseNumber?.setValue('DOC123456');
      expect(licenseNumber?.valid).toBe(true);
    });

    it('should not require licenseNumber when userType is client', () => {
      component.userType.set('client');
      fixture.detectChanges();
      
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      expect(component.registerForm.valid).toBe(true);
    });
  });

  describe('toggleUserType', () => {
    it('should toggle from client to doctor', () => {
      component.userType.set('client');
      component.toggleUserType();
      expect(component.userType()).toBe('doctor');
    });

    it('should toggle from doctor to client', () => {
      component.userType.set('doctor');
      component.toggleUserType();
      expect(component.userType()).toBe('client');
    });

    it('should toggle multiple times correctly', () => {
      component.userType.set('client');
      component.toggleUserType();
      expect(component.userType()).toBe('doctor');
      component.toggleUserType();
      expect(component.userType()).toBe('client');
      component.toggleUserType();
      expect(component.userType()).toBe('doctor');
    });
  });

  describe('register', () => {
    it('should not proceed if form is invalid', () => {
      spyOn(console, 'log');
      component.register();
      expect(console.log).toHaveBeenCalledWith('Form is invalid');
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.register();
      expect(component.registerForm.get('fullName')?.touched).toBe(true);
      expect(component.registerForm.get('email')?.touched).toBe(true);
    });

    it('should call authService.register with correct values for client', () => {
      component.userType.set('client');
      component.registerForm.patchValue({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      mockAuthService.register.and.returnValue(of({ success: true, uid: 'user123' }));

      component.register();

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'john@example.com',
        'password123',
        'John Doe',
        'client',
        undefined
      );
    });

    it('should call authService.register with licenseNumber for doctor', () => {
      component.userType.set('doctor');
      component.registerForm.patchValue({
        fullName: 'Dr. Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        licenseNumber: 'DOC789'
      });
      mockAuthService.register.and.returnValue(of({ success: true, uid: 'user456' }));

      component.register();

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'jane@example.com',
        'password123',
        'Dr. Jane Smith',
        'doctor',
        'DOC789'
      );
    });

    it('should navigate to /login on successful registration', () => {
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      mockAuthService.register.and.returnValue(of({ success: true, uid: 'user123' }));

      component.register();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.isLoading()).toBe(false);
    });

    it('should set errorMessage on registration failure', () => {
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      mockAuthService.register.and.returnValue(of({ success: false, error: 'Email already exists' }));

      component.register();

      expect(component.errorMessage()).toBe('Email already exists');
      expect(component.isLoading()).toBe(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle registration with default error message', () => {
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      mockAuthService.register.and.returnValue(of({ success: false }));

      component.register();

      expect(component.errorMessage()).toBe('Error al registrarse');
    });

    it('should handle observable errors', () => {
      spyOn(console, 'error');
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      mockAuthService.register.and.returnValue(throwError(() => new Error('Network error')));

      component.register();

      expect(component.errorMessage()).toBe('Error al registrarse. Intenta de nuevo.');
      expect(component.isLoading()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should clear errorMessage before new registration attempt', () => {
      component.errorMessage.set('Previous error');
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      mockAuthService.register.and.returnValue(of({ success: true, uid: 'user123' }));

      component.register();

      expect(mockAuthService.register).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty licenseNumber for client', () => {
      component.userType.set('client');
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        licenseNumber: ''
      });
      mockAuthService.register.and.returnValue(of({ success: true, uid: 'user123' }));

      component.register();

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User',
        'client',
        undefined
      );
    });

    it('should handle special characters in fullName', () => {
      component.registerForm.patchValue({
        fullName: "O'Brien-García",
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      mockAuthService.register.and.returnValue(of({ success: true, uid: 'user123' }));

      component.register();

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        "O'Brien-García",
        'client',
        undefined
      );
    });

    it('should handle minimum length password (8 characters)', () => {
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: '12345678',
        confirmPassword: '12345678'
      });
      
      expect(component.registerForm.get('password')?.valid).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: '1234567',
        confirmPassword: '1234567'
      });
      
      expect(component.registerForm.get('password')?.hasError('minLength')).toBe(true);
    });

    it('should handle very long input values', () => {
      const longName = 'a'.repeat(200);
      const longEmail = 'a'.repeat(100) + '@example.com';
      
      component.registerForm.patchValue({
        fullName: longName,
        email: longEmail,
        password: 'password123',
        confirmPassword: 'password123'
      });
      mockAuthService.register.and.returnValue(of({ success: true, uid: 'user123' }));

      component.register();

      expect(mockAuthService.register).toHaveBeenCalledWith(
        longEmail,
        'password123',
        longName,
        'client',
        undefined
      );
    });
  });

  describe('isSubmittable', () => {
    it('should be false when form is invalid', () => {
      expect(component.isSubmittable()).toBe(false);
    });

    it('should be false when loading', () => {
      component.registerForm.patchValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      component.isLoading.set(true);
      expect(component.isSubmittable()).toBe(false);
    });
  });
});
