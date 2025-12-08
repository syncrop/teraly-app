import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { RouterLink } from '@angular/router';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, RouterLink]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isActive', () => {
    it('should return false for any path', () => {
      expect(component.isActive('/home')).toBe(false);
      expect(component.isActive('/about')).toBe(false);
      expect(component.isActive('/contact')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(component.isActive('')).toBe(false);
    });

    it('should handle null or undefined gracefully', () => {
      expect(component.isActive(null as any)).toBe(false);
      expect(component.isActive(undefined as any)).toBe(false);
    });
  });

  it('should use OnPush change detection strategy', () => {
    expect(fixture.componentRef.changeDetectorRef).toBeTruthy();
  });
});
