import { Component, signal, inject, OnDestroy } from '@angular/core';
import { LoaderService } from '../../../services/loader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    @if (isVisible()) {
      <div class="loader-screen">
        <div class="relative w-32 h-32 mb-4">
          <!-- LOGO SVG ANIMADO -->
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-xl">
            <!-- 1. Barra Horizontal -->
            <path class="path-line path-horizontal" d="M20 25H80" stroke="#7c3aed" stroke-width="14" stroke-linecap="round"/>
            
            <!-- 2. Barra Vertical -->
            <path class="path-line path-vertical" d="M50 25V80" stroke="#7c3aed" stroke-width="14" stroke-linecap="round"/>
            
            <!-- 3. Punto Vital -->
            <circle class="dot-vital" cx="80" cy="80" r="8" fill="#4ade80" stroke="#0f172a" stroke-width="3"/>
          </svg>
        </div>
        
        <!-- TEXTO DE MARCA -->
        <h1 class="brand-text text-3xl font-bold tracking-tight text-white">teraly</h1>
      </div>
    }
  `,
  styles: [`
    /* --- CONTENEDOR DE CARGA (Ocupa toda la pantalla) --- */
    .loader-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #0f172a;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: fadeInScreen 0.3s ease-in-out;
    }

    .loader-screen.fade-out {
      animation: fadeOutScreen 0.5s ease-in-out forwards;
    }

    /* --- ANIMACIONES SVG --- */
    
    /* Configuración base de las líneas */
    .path-line {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      opacity: 0;
    }

    /* Animación: Línea Horizontal de la T */
    .path-horizontal {
      animation: drawLine 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      animation-delay: 0.2s;
    }

    /* Animación: Línea Vertical de la T */
    .path-vertical {
      animation: drawLine 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      animation-delay: 0.6s;
    }

    /* Animación: Punto Verde (Pop + Pulso) */
    .dot-vital {
      transform-origin: 80px 80px;
      transform: scale(0);
      animation: 
        popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 1.2s,
        pulseGreen 2s infinite ease-in-out 1.8s;
    }

    /* Animación: Texto (Aparece suavemente) */
    .brand-text {
      opacity: 0;
      transform: translateY(10px);
      animation: fadeUp 0.8s ease-out forwards 1.4s;
    }

    /* --- DEFINICIÓN DE KEYFRAMES --- */

    @keyframes drawLine {
      0% {
        stroke-dashoffset: 100;
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      100% {
        stroke-dashoffset: 0;
        opacity: 1;
      }
    }

    @keyframes popIn {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes pulseGreen {
      0% { fill: #4ade80; filter: drop-shadow(0 0 0 rgba(74, 222, 128, 0)); }
      50% { fill: #86efac; filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.6)); }
      100% { fill: #4ade80; filter: drop-shadow(0 0 0 rgba(74, 222, 128, 0)); }
    }

    @keyframes fadeUp {
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeInScreen {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fadeOutScreen {
      to { opacity: 0; visibility: hidden; }
    }
  `]
})
export class LoaderComponent implements OnDestroy {
  private loaderService = inject(LoaderService);
  isVisible = signal(false);
  private subscription: Subscription;

  constructor() {
    this.subscription = this.loaderService.isLoading$.subscribe(isLoading => {
      this.isVisible.set(isLoading);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
