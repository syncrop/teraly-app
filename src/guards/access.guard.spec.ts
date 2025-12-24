import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { accessGuard } from './access.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';

describe('accessGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserRole: signal(null)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    mockRoute = {
      data: {}
    } as any;

    mockState = {
      url: '/test'
    } as RouterStateSnapshot;
  });

  it('should allow access to noAuth routes when user is not authenticated', () => {
    mockRoute.data = { noAuth: true };
    authService.currentUserRole.set(null);

    const result = TestBed.runInInjectionContext(() => 
      accessGuard(mockRoute, mockState)
    );

    expect(result).toBe(true);
  });

  it('should redirect authenticated client to home-client when accessing noAuth route', () => {
    mockRoute.data = { noAuth: true };
    authService.currentUserRole.set('client');
    
    const urlTree = {} as UrlTree;
    router.parseUrl.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => 
      accessGuard(mockRoute, mockState)
    );

    expect(router.parseUrl).toHaveBeenCalledWith('/app/home-client');
    expect(result).toBe(urlTree);
  });

  it('should redirect authenticated doctor to home-doctor when accessing noAuth route', () => {
    mockRoute.data = { noAuth: true };
    authService.currentUserRole.set('doctor');
    
    const urlTree = {} as UrlTree;
    router.parseUrl.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => 
      accessGuard(mockRoute, mockState)
    );

    expect(router.parseUrl).toHaveBeenCalledWith('/app/home-doctor');
    expect(result).toBe(urlTree);
  });

  it('should redirect unauthenticated user to login for protected routes', () => {
    mockRoute.data = {};
    authService.currentUserRole.set(null);
    
    const urlTree = {} as UrlTree;
    router.parseUrl.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => 
      accessGuard(mockRoute, mockState)
    );

    expect(router.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).toBe(urlTree);
  });

  it('should allow access when user has expected role', () => {
    mockRoute.data = { expectedRole: 'doctor' };
    authService.currentUserRole.set('doctor');

    const result = TestBed.runInInjectionContext(() => 
      accessGuard(mockRoute, mockState)
    );

    expect(result).toBe(true);
  });

  it('should redirect doctor to home-doctor when accessing client-only route', () => {
    mockRoute.data = { expectedRole: 'client' };
    authService.currentUserRole.set('doctor');
    
    const urlTree = {} as UrlTree;
    router.parseUrl.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => 
      accessGuard(mockRoute, mockState)
    );

    expect(router.parseUrl).toHaveBeenCalledWith('/app/home-doctor');
    expect(result).toBe(urlTree);
  });

  it('should redirect client to home-client when accessing doctor-only route', () => {
    mockRoute.data = { expectedRole: 'doctor' };
    authService.currentUserRole.set('client');
    
    const urlTree = {} as UrlTree;
    router.parseUrl.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => 
      accessGuard(mockRoute, mockState)
    );

    expect(router.parseUrl).toHaveBeenCalledWith('/app/home-client');
    expect(result).toBe(urlTree);
  });

  it('should allow access to authenticated users when no specific role required', () => {
    mockRoute.data = {};
    authService.currentUserRole.set('client');

    const result = TestBed.runInInjectionContext(() => 
      accessGuard(mockRoute, mockState)
    );

    expect(result).toBe(true);
  });

  it('should allow authenticated doctor access when no specific role required', () => {
    mockRoute.data = {};
    authService.currentUserRole.set('doctor');

    const result = TestBed.runInInjectionContext(() => 
      accessGuard(mockRoute, mockState)
    );

    expect(result).toBe(true);
  });
});
