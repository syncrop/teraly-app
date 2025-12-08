import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';
import { Router } from '@angular/router';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockI18nService: jasmine.SpyObj<I18nService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout']);
    mockI18nService = jasmine.createSpyObj('I18nService', ['setLanguage']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: I18nService, useValue: mockI18nService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject AuthService', () => {
    expect(component['authService']).toBe(mockAuthService);
  });

  it('should inject I18nService', () => {
    expect(component.i18nService).toBe(mockI18nService);
  });

  it('should inject Router', () => {
    expect(component['router']).toBe(mockRouter);
  });

  describe('logout', () => {
    it('should call authService.logout', () => {
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should call logout only once per invocation', () => {
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
      
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalledTimes(2);
    });
  });

  describe('changeLanguage', () => {
    it('should call i18nService.setLanguage with provided language code', () => {
      component.changeLanguage('es');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('es');
    });

    it('should handle English language', () => {
      component.changeLanguage('en');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('en');
    });

    it('should handle Polish language', () => {
      component.changeLanguage('pl');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('pl');
    });

    it('should handle Ukrainian language', () => {
      component.changeLanguage('uk');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('uk');
    });

    it('should pass any language code to i18nService', () => {
      component.changeLanguage('fr');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('fr');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string language code', () => {
      component.changeLanguage('');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('');
    });

    it('should handle uppercase language codes', () => {
      component.changeLanguage('ES');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('ES');
    });

    it('should handle invalid language codes', () => {
      component.changeLanguage('invalid');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('invalid');
    });

    it('should handle multiple language changes', () => {
      component.changeLanguage('en');
      component.changeLanguage('es');
      component.changeLanguage('pl');
      
      expect(mockI18nService.setLanguage).toHaveBeenCalledTimes(3);
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('en');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('es');
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('pl');
    });

    it('should handle logout after language change', () => {
      component.changeLanguage('es');
      component.logout();
      
      expect(mockI18nService.setLanguage).toHaveBeenCalledWith('es');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should handle multiple logouts', () => {
      component.logout();
      component.logout();
      component.logout();
      
      expect(mockAuthService.logout).toHaveBeenCalledTimes(3);
    });
  });
});
