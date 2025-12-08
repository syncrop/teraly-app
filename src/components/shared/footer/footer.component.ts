import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Componente de pie de página que contiene enlaces de navegación.
 * Proporciona navegación básica y detección de rutas activas.
 * 
 * @selector app-footer
 * 
 * @example
 * ```html
 * <!-- Uso básico -->
 * <app-footer></app-footer>
 * ```
 * 
 * @example
 * ```typescript
 * // En un layout component
 * import { FooterComponent } from './components/shared/footer/footer.component';
 * 
 * @Component({
 *   imports: [FooterComponent],
 *   template: `
 *     <main>
 *       <!-- contenido -->
 *     </main>
 *     <app-footer></app-footer>
 *   `
 * })
 * export class LayoutComponent {}
 * ```
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink]
})
export class FooterComponent {
  /**
   * Verifica si una ruta está activa actualmente.
   * TODO: Implementar detección real de ruta activa.
   * 
   * @param {string} path - Ruta a verificar
   * @returns {boolean} true si la ruta está activa, false en caso contrario
   * 
   * @example
   * ```typescript
   * const active = this.isActive('/home');
   * ```
   */
  isActive(path: string): boolean {
    // This will be enhanced with actual route detection in a real app
    return false;
  }
}
