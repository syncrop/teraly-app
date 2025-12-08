import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private translations = signal<{ [key: string]: string }>({});

  setTranslations(trans: { [key: string]: string }) {
    this.translations.set(trans);
  }

  getTranslation(key: string, defaultValue: string = ''): string {
    return this.translations()[key] || defaultValue;
  }

  get allTranslations() {
    return this.translations;
  }
}
