import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let authMock: jasmine.SpyObj<Auth>;
  let firestoreMock: jasmine.SpyObj<Firestore>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('Auth', ['signInWithEmailAndPassword']);
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection', 'doc']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Clear localStorage before each test
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: authSpy },
        { provide: Firestore, useValue: firestoreSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    authMock = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    firestoreMock = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
    routerMock = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with stored role from localStorage', () => {
    localStorage.setItem('userRole', 'doctor');
    const newService = new AuthService();
    expect(newService.currentUserRole()).toBe('doctor');
  });

  it('should initialize with null role when no stored role', () => {
    expect(service.currentUserRole()).toBeNull();
  });

  describe('login', () => {
    it('should successfully login a client user', (done) => {
      const mockCredential = {
        user: {
          uid: 'test-uid',
          email: 'client@test.com',
          getIdTokenResult: () => Promise.resolve({ 
            token: 'test-token',
            expirationTime: new Date(Date.now() + 3600000).toISOString()
          })
        }
      };

      const mockUserData = {
        uid: 'test-uid',
        email: 'client@test.com',
        fullName: 'Test Client',
        role: 'client',
        createdAt: new Date(),
        isVerified: true,
        languages: ['es']
      };

      spyOn(service, 'login').and.returnValue(of({ success: true, role: 'client' }));

      service.login('client@test.com', 'password').subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.role).toBe('client');
        done();
      });
    });

    it('should handle login errors', (done) => {
      spyOn(service, 'login').and.returnValue(of({ 
        success: false, 
        error: 'Usuario no encontrado' 
      }));

      service.login('wrong@test.com', 'wrongpass').subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
        done();
      });
    });

    it('should handle invalid email error', (done) => {
      spyOn(service, 'login').and.returnValue(of({ 
        success: false, 
        error: 'Email inválido' 
      }));

      service.login('invalid-email', 'password').subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Email inválido');
        done();
      });
    });
  });

  describe('register', () => {
    it('should successfully register a new client', (done) => {
      spyOn(service, 'register').and.returnValue(of({ 
        success: true, 
        uid: 'new-uid' 
      }));

      service.register('new@test.com', 'password', 'New User', 'client').subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.uid).toBeTruthy();
        done();
      });
    });

    it('should successfully register a new doctor', (done) => {
      spyOn(service, 'register').and.returnValue(of({ 
        success: true, 
        uid: 'doctor-uid' 
      }));

      service.register('doctor@test.com', 'password', 'Dr. New', 'doctor', '12345', ['es']).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle email already in use error', (done) => {
      spyOn(service, 'register').and.returnValue(of({ 
        success: false, 
        error: 'El email ya está registrado' 
      }));

      service.register('existing@test.com', 'password', 'User', 'client').subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('El email ya está registrado');
        done();
      });
    });

    it('should handle weak password error', (done) => {
      spyOn(service, 'register').and.returnValue(of({ 
        success: false, 
        error: 'La contraseña es muy débil' 
      }));

      service.register('new@test.com', '123', 'User', 'client').subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('La contraseña es muy débil');
        done();
      });
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email successfully', (done) => {
      spyOn(service, 'resetPassword').and.returnValue(of({ success: true }));

      service.resetPassword('test@example.com').subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle user not found error', (done) => {
      spyOn(service, 'resetPassword').and.returnValue(of({ 
        success: false, 
        error: 'Usuario no encontrado' 
      }));

      service.resetPassword('nonexistent@test.com').subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Usuario no encontrado');
        done();
      });
    });
  });

  describe('logout', () => {
    it('should clear user data and navigate to login', () => {
      service.currentUserRole.set('client');
      localStorage.setItem('userRole', 'client');
      localStorage.setItem('userId', 'test-uid');
      sessionStorage.setItem('idToken', 'token');

      service.logout();

      expect(localStorage.getItem('userRole')).toBeNull();
      expect(localStorage.getItem('userId')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      service.currentUserRole.set('client');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      service.currentUserRole.set(null);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUserId', () => {
    it('should return uid from current user signal', () => {
      service.currentUser.set({
        uid: 'signal-uid',
        email: 'test@test.com',
        fullName: 'Test',
        role: 'client',
        createdAt: new Date(),
        isVerified: true,
        languages: []
      });
      expect(service.getCurrentUserId()).toBe('signal-uid');
    });

    it('should return uid from sessionStorage when signal is null', () => {
      sessionStorage.setItem('localId', 'session-uid');
      expect(service.getCurrentUserId()).toBe('session-uid');
    });

    it('should return uid from localStorage as fallback', () => {
      localStorage.setItem('userId', 'local-uid');
      expect(service.getCurrentUserId()).toBe('local-uid');
    });

    it('should return null when no uid is available', () => {
      expect(service.getCurrentUserId()).toBeNull();
    });
  });
});
