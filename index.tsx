import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { LOCALE_ID, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

import '@angular/localize/init';
import { loadTranslations } from '@angular/localize';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';

// --- Locale Detection ---
const SUPPORTED_LOCALES = ['en', 'es', 'pl', 'uk'];
let locale = 'en'; // Default locale

const storedLang = localStorage.getItem('teraly-lang');
const browserLang = navigator.language.split('-')[0];

if (storedLang && SUPPORTED_LOCALES.includes(storedLang)) {
  locale = storedLang;
} else if (browserLang && SUPPORTED_LOCALES.includes(browserLang)) {
  locale = browserLang;
}

// --- Asynchronous Bootstrap ---
const bootstrap = () => {
  bootstrapApplication(AppComponent, {
    providers: [
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(APP_ROUTES, withHashLocation()),
      provideHttpClient(),
      importProvidersFrom(ReactiveFormsModule),
      { provide: LOCALE_ID, useValue: locale },
    ],
  }).catch((err) => console.error(err));
};

// If the locale is the source locale (English), bootstrap immediately.
// Otherwise, fetch the translation file first.
if (locale === 'en') {
  bootstrap();
} else {
  // Use an absolute path from the domain root to make the fetch more robust.
  fetch(`/assets/i18n/${locale}.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load translation file for locale '${locale}'`);
      }
      return response.json();
    })
    .then((translations) => {
      loadTranslations(translations.translations);
      bootstrap();
    })
    .catch((error) => {
      console.error(error);
      // Fallback to English if translations fail to load
      bootstrap();
    });
}

// AI Studio always uses an `index.tsx` file for all project types.