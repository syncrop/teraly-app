import { Injectable, signal } from '@angular/core';

/**
 * Servicio para gestionar traducciones de forma dinámica en la aplicación.
 * Permite establecer y obtener traducciones usando claves.
 * 
 * @example
 * ```typescript
 * // Inyectar el servicio
 * constructor(private translationService: TranslationService) {}
 * 
 * // Establecer traducciones
 * this.translationService.setTranslations({
 *   'welcome': 'Bienvenido',
 *   'logout': 'Cerrar sesión',
 *   'profile': 'Perfil'
 * });
 * 
 * // Obtener una traducción
 * const welcomeText = this.translationService.getTranslation('welcome', 'Welcome');
 * console.log(welcomeText); // 'Bienvenido'
 * 
 * // Obtener todas las traducciones
 * const all = this.translationService.allTranslations();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations = signal<{ [key: string]: string }>({});

  /**
   * Establece el diccionario completo de traducciones.
   * 
   * @param {Object.<string, string>} trans - Diccionario de traducciones (clave-valor)
   * @returns {void}
   * 
   * @example
   * ```typescript
   * this.translationService.setTranslations({
   *   'home': 'Inicio',
   *   'settings': 'Configuración',
   *   'help': 'Ayuda'
   * });
   * ```
   */
  setTranslations(trans: { [key: string]: string }) {
    this.translations.set(trans);
  }

  /**
   * Obtiene una traducción por su clave. Si no existe, retorna el valor por defecto.
   * 
   * @param {string} key - Clave de la traducción
   * @param {string} [defaultValue=''] - Valor por defecto si no se encuentra la traducción
   * @returns {string} Traducción encontrada o valor por defecto
   * 
   * @example
   * ```typescript
   * const text = this.translationService.getTranslation('welcome', 'Welcome');
   * // Retorna la traducción de 'welcome' o 'Welcome' si no existe
   * ```
   */
  getTranslation(key: string, defaultValue: string = ''): string {
    return this.translations()[key] || defaultValue;
  }

  get allTranslations() {
    return this.translations;
  }
}
