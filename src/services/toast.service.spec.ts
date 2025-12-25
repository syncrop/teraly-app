import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default state', () => {
    const state = service.toastState();
    expect(state.isVisible).toBe(false);
    expect(state.message).toBe('');
    expect(state.type).toBe('info');
  });

  it('should show toast with custom message and type', () => {
    service.show('Test message', 'success');
    const state = service.toastState();
    
    expect(state.isVisible).toBe(true);
    expect(state.message).toBe('Test message');
    expect(state.type).toBe('success');
  });

  it('should auto-hide toast after specified duration', () => {
    service.show('Test message', 'info', 3000);
    expect(service.toastState().isVisible).toBe(true);
    
    jasmine.clock().tick(3000);
    expect(service.toastState().isVisible).toBe(false);
  });

  it('should hide toast manually', () => {
    service.show('Test message');
    expect(service.toastState().isVisible).toBe(true);
    
    service.hide();
    expect(service.toastState().isVisible).toBe(false);
  });

  it('should show success toast', () => {
    service.success('Success message');
    const state = service.toastState();
    
    expect(state.isVisible).toBe(true);
    expect(state.message).toBe('Success message');
    expect(state.type).toBe('success');
  });

  it('should show error toast', () => {
    service.error('Error message');
    const state = service.toastState();
    
    expect(state.isVisible).toBe(true);
    expect(state.message).toBe('Error message');
    expect(state.type).toBe('error');
  });

  it('should show info toast', () => {
    service.info('Info message');
    const state = service.toastState();
    
    expect(state.isVisible).toBe(true);
    expect(state.message).toBe('Info message');
    expect(state.type).toBe('info');
  });

  it('should clear previous timeout when showing new toast', () => {
    service.show('First message', 'info', 5000);
    expect(service.toastState().message).toBe('First message');
    
    jasmine.clock().tick(2000);
    
    service.show('Second message', 'success', 3000);
    expect(service.toastState().message).toBe('Second message');
    expect(service.toastState().isVisible).toBe(true);
    
    jasmine.clock().tick(3000);
    expect(service.toastState().isVisible).toBe(false);
  });
});
