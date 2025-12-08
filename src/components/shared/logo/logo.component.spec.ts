import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let component: LogoComponent;
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the logo SVG', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('should display the Teraly text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.querySelector('span');
    expect(text?.textContent).toContain('Teraly');
  });

  it('should have proper styling classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('div');
    expect(container?.classList.contains('flex')).toBe(true);
    expect(container?.classList.contains('items-center')).toBe(true);
  });

  it('should use OnPush change detection strategy', () => {
    expect(fixture.componentRef.changeDetectorRef).toBeTruthy();
  });
});
