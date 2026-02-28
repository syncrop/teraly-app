import { Component, signal, inject, OnDestroy, OnInit } from '@angular/core';
import { LoaderService } from '../../../services/loader.service';
import { Subscription, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    @if (isVisible() || !isOnline()) {
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
        
        <!-- MENSAJE DE CONEXIÓN -->
        @if (!isOnline()) {
          <div class="offline-message">
            <svg class="w-8 h-8 mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
            </svg>
            <p class="text-white text-lg font-medium">Sin conexión a Internet</p>
            <p class="text-gray-400 text-sm mt-1">Esperando conexión...</p>
          </div>
        }
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

    /* --- MENSAJE SIN CONEXIÓN --- */
    .offline-message {
      position: absolute;
      bottom: 20%;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: fadeUp 0.5s ease-out forwards;
    }
  `]
})
export class LoaderComponent implements OnInit, OnDestroy {
  private loaderService = inject(LoaderService);
  isVisible = signal(false);
  isOnline = signal(navigator.onLine);
  private subscription: Subscription;
  private networkSubscription?: Subscription;

  constructor() {
    this.subscription = this.loaderService.isLoading$.subscribe(isLoading => {
      this.isVisible.set(isLoading);
    });
  }

  ngOnInit(): void {
    // Escuchar cambios en la conectividad
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    this.networkSubscription = merge(online$, offline$).subscribe(status => {
      this.isOnline.set(status);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.networkSubscription?.unsubscribe();
  }
}
