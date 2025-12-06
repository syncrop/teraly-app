import { Injectable, LOCALE_ID, inject, signal } from '@angular/core';

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

  setLanguage(langCode: string) {
    if (this.availableLanguages.some(l => l.code === langCode)) {
      localStorage.setItem('teraly-lang', langCode);
      // Reload the page to apply the new locale which is loaded at bootstrap
      window.location.reload();
    }
  }
}
