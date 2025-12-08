import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toastState = signal<ToastState>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  private hideTimeout?: number;

  show(message: string, type: ToastType = 'info', duration: number = 3000) {
    // Limpiar timeout anterior si existe
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Mostrar toast
    this.toastState.set({
      isVisible: true,
      message,
      type
    });

    // Auto-ocultar después del duration
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    this.toastState.update(state => ({
      ...state,
      isVisible: false
    }));

    // Limpiar timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }
}
