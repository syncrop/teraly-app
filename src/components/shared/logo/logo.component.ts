
import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Componente que muestra el logo de Teraly con su icono y texto.
 * Es un componente de presentación sin estado.
 * 
 * @selector app-logo
 * 
 * @example
 * ```html
 * <!-- Uso básico -->
 * <app-logo></app-logo>
 * ```
 * 
 * @example
 * ```typescript
 * // En un componente padre
 * import { LogoComponent } from './components/shared/logo/logo.component';
 * 
 * @Component({
 *   imports: [LogoComponent],
 *   template: '<app-logo></app-logo>'
 * })
 * export class HeaderComponent {}
 * ```
 */
@Component({
  selector: 'app-logo',
  template: `
    <div class="flex items-center space-x-2">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 6C10 5.44772 10.4477 5 11 5H21C21.5523 5 22 5.44772 22 6V11C22 11.5523 21.5523 12 21 12H11C10.4477 12 10 11.5523 10 11V6Z" fill="#6366F1"/>
        <path d="M5 16C5 15.4477 5.44772 15 6 15H26C26.5523 15 27 15.4477 27 16V26C27 26.5523 26.5523 27 26 27H6C5.44772 27 5 26.5523 5 26V16Z" fill="#4338CA"/>
      </svg>
      <span class="text-2xl font-bold text-indigo-900">Teraly</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoComponent {}
