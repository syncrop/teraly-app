import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login'], {
      currentUserRole: signal(null),
      currentUser: signal(null)
    });
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'show']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authServiceMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastServiceMock = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    routerMock = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should mark email as invalid when empty', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.invalid).toBe(true);
  });

  it('should mark email as invalid when format is incorrect', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.invalid).toBe(true);
  });

  it('should mark email as valid when format is correct', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('test@example.com');
    expect(emailControl?.valid).toBe(true);
  });

  it('should mark password as invalid when empty', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.invalid).toBe(true);
  });

  it('should mark form as valid when all fields are filled correctly', () => {
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(component.loginForm.valid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.loginForm.patchValue({
      email: '',
      password: ''
    });
    
    component.login();
    
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should successfully login as client and navigate to home-client', (done) => {
    component.loginForm.patchValue({
      email: 'client@test.com',
      password: 'password123'
    });

    authServiceMock.currentUserRole.set('client');
    authServiceMock.currentUser.set({
      uid: 'client-1',
      email: 'client@test.com',
      fullName: 'Test Client',
      role: 'client',
      createdAt: new Date(),
      isVerified: true,
      languages: []
    });
    
    authServiceMock.login.and.returnValue(of({ success: true, role: 'client' }));

    component.login();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(toastServiceMock.success).toHaveBeenCalledWith('¡Bienvenido! Inicio de sesión exitoso');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/home-client']);
      done();
    }, 100);
  });

  it('should successfully login as doctor with complete profile and navigate to home-doctor', (done) => {
    component.loginForm.patchValue({
      email: 'doctor@test.com',
      password: 'password123'
    });

    authServiceMock.currentUserRole.set('doctor');
    authServiceMock.currentUser.set({
      uid: 'doctor-1',
      email: 'doctor@test.com',
      fullName: 'Dr. Test',
      role: 'doctor',
      createdAt: new Date(),
      isVerified: true,
      specialty: 'Psicología',
      completed: true,
      languages: []
    });
    
    authServiceMock.login.and.returnValue(of({ success: true, role: 'doctor' }));

    component.login();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/home-doctor']);
      done();
    }, 100);
  });

  it('should redirect doctor with incomplete profile to profile page', (done) => {
    component.loginForm.patchValue({
      email: 'doctor@test.com',
      password: 'password123'
    });

    authServiceMock.currentUserRole.set('doctor');
    authServiceMock.currentUser.set({
      uid: 'doctor-1',
      email: 'doctor@test.com',
      fullName: 'Dr. Test',
      role: 'doctor',
      createdAt: new Date(),
      isVerified: true,
      completed: false,
      languages: []
    });
    
    authServiceMock.login.and.returnValue(of({ success: true, role: 'doctor' }));

    component.login();

    setTimeout(() => {
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/profile']);
      expect(toastServiceMock.show).toHaveBeenCalledWith('Por favor, completa tu perfil para comenzar', 'info');
      done();
    }, 100);
  });

  it('should handle login error and show error message', (done) => {
    component.loginForm.patchValue({
      email: 'wrong@test.com',
      password: 'wrongpassword'
    });

    authServiceMock.login.and.returnValue(of({ 
      success: false, 
      error: 'Contraseña incorrecta' 
    }));

    component.login();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Contraseña incorrecta');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Contraseña incorrecta');
      done();
    }, 100);
  });

  it('should handle login exception', (done) => {
    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'password'
    });

    authServiceMock.login.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    component.login();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Error al iniciar sesión. Intenta de nuevo.');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Error al iniciar sesión. Intenta de nuevo.');
      done();
    }, 100);
  });

  it('should set loading state during login', () => {
    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'password'
    });

    authServiceMock.login.and.returnValue(of({ success: true, role: 'client' }));

    expect(component.isLoading()).toBe(false);
    component.login();
    expect(component.isLoading()).toBe(true);
  });

  it('should clear error message when starting new login', () => {
    component.errorMessage.set('Previous error');
    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'password'
    });

    authServiceMock.login.and.returnValue(of({ success: true, role: 'client' }));
    component.login();

    expect(component.errorMessage()).toBeNull();
  });

  it('should compute isSubmittable based on form validity and loading state', () => {
    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'password'
    });
    
    expect(component.isSubmittable()).toBe(true);
    
    component.isLoading.set(true);
    fixture.detectChanges();
    
    expect(component.isSubmittable()).toBe(false);
  });
});
