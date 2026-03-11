import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Contenedor fijo en la parte superior (o inferior si prefieres bottom-5) -->
    <div 
      class="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm transition-all duration-300 ease-in-out transform"
      [class.translate-y-0]="toastService.toastState().isVisible"
      [class.opacity-100]="toastService.toastState().isVisible"
      [class.-translate-y-20]="!toastService.toastState().isVisible"
      [class.opacity-0]="!toastService.toastState().isVisible"
    >
      <div 
        class="flex items-center gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-sm"
        [ngClass]="{
          'bg-red-50 border-red-100 text-red-800': toastService.toastState().type === 'error',
          'bg-green-50 border-green-100 text-green-800': toastService.toastState().type === 'success',
          'bg-indigo-50 border-indigo-100 text-indigo-800': toastService.toastState().type === 'info'
        }"
      >
        <!-- Iconos dinámicos -->
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          [ngClass]="{
            'bg-red-100 text-red-600': toastService.toastState().type === 'error',
            'bg-green-100 text-green-600': toastService.toastState().type === 'success',
            'bg-indigo-100 text-indigo-600': toastService.toastState().type === 'info'
          }"
        >
          <!-- Error Icon -->
          <svg *ngIf="toastService.toastState().type === 'error'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <!-- Success Icon -->
          <svg *ngIf="toastService.toastState().type === 'success'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <!-- Info Icon -->
          <svg *ngIf="toastService.toastState().type === 'info'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>

        <!-- Mensaje -->
        <div class="flex-1">
          <p class="text-sm font-semibold">{{ titleFor(toastService.toastState().type) }}</p>
          <p class="text-xs opacity-90 font-medium">{{ toastService.toastState().message }}</p>
        </div>

        <!-- Botón cerrar -->
        <button (click)="toastService.hide()" class="p-1 hover:bg-black/5 rounded-full transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);

  titleFor(type: ToastType): string {
    switch (type) {
      case 'error':
        return $localize`:@@toast.title.error:¡Ups!`;
      case 'success':
        return $localize`:@@toast.title.success:¡Hecho!`;
      case 'info':
      default:
        return $localize`:@@toast.title.info:Info`;
    }
  }
}
