import { Injectable, LOCALE_ID, inject, signal } from '@angular/core';

/**
 * Interfaz que representa un idioma disponible en la aplicación.
 * @interface Language
 * @property {string} code - Código ISO del idioma (ej: 'en', 'es')
 * @property {string} label - Nombre del idioma en su lengua nativa
 */
export interface Language {
  code: string;
  label: string;
}

/**
 * Servicio de internacionalización (i18n) que gestiona los idiomas disponibles
 * y permite cambiar el idioma de la aplicación.
 * 
 * @example
 * ```typescript
 * // Inyectar el servicio
 * constructor(private i18nService: I18nService) {}
 * 
 * // Obtener idioma actual
 * const currentLang = this.i18nService.currentLang();
 * console.log('Idioma actual:', currentLang);
 * 
 * // Cambiar idioma
 * this.i18nService.setLanguage('es'); // Cambia a español y recarga la página
 * 
 * // Listar idiomas disponibles
 * this.i18nService.availableLanguages.forEach(lang => {
 *   console.log(`${lang.label} (${lang.code})`);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private localeId = inject(LOCALE_ID);

  availableLanguages: Language[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'pl', label: 'Polski' },
    { code: 'uk', label: 'Українська' },
  ];

  currentLang = signal<string>(this.localeId);

  /**
   * Cambia el idioma de la aplicación y recarga la página para aplicar los cambios.
   * El código del idioma se guarda en localStorage para persistir la preferencia.
   * 
   * @param {string} langCode - Código del idioma (debe estar en availableLanguages)
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // Cambiar a español
   * this.i18nService.setLanguage('es');
   * 
   * // Cambiar a inglés
   * this.i18nService.setLanguage('en');
   * ```
   */
  setLanguage(langCode: string) {
    if (this.availableLanguages.some(l => l.code === langCode)) {
      localStorage.setItem('teraly-lang', langCode);
      // Reload the page to apply the new locale which is loaded at bootstrap
      window.location.reload();
    }
  }
}
