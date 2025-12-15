import { Injectable, LOCALE_ID, inject, signal } from '@angular/core';
import { loadTranslations } from '@angular/localize';

export interface Language {
  code: string;
  label: string;
}

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

  async setLanguage(langCode: string) {
    if (this.availableLanguages.some(l => l.code === langCode)) {
      try {
        // Load new translations
        const response = await fetch(`/src/assets/i18n/${langCode}.json`);
        const data = await response.json();
        const translations = data.translations || {};
        
        // Load into $localize
        loadTranslations(translations);
        
        // Update current language
        this.currentLang.set(langCode);
        localStorage.setItem('teraly-lang', langCode);
        
        // Reload to apply $localize changes (needed for i18n attributes)
        window.location.reload();
      } catch (error) {
        console.error(`Failed to load translations for ${langCode}`, error);
      }
    }
  }
}
