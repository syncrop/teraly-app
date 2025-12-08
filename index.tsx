import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { LOCALE_ID, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

import '@angular/localize/init';
import { loadTranslations } from '@angular/localize';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';

async function bootstrapApp() {
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

  // Load translations if the locale is not the source locale (English)
  if (locale !== 'en') {
    try {

      const response = await fetch(`/src/assets/i18n/${locale}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      // Guard against a strange platform issue where the response body is "undefined"
      if (responseText === 'undefined') {
        throw new Error(`Received "undefined" as response for ${locale}.json`);
      }

      const translations = JSON.parse(responseText);
      loadTranslations(translations.translations);
    } catch (error) {
      console.error(`Failed to load translations for '${locale}'. Falling back to 'en'.`, error);
      locale = 'en'; // Fallback to the default locale
    }
  }

  // Bootstrap the application
  try {
    await bootstrapApplication(AppComponent, {
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(APP_ROUTES, withHashLocation()),
        provideHttpClient(),
        importProvidersFrom(ReactiveFormsModule),
        { provide: LOCALE_ID, useValue: locale },
      ],
    });
  } catch (err) {
    console.error('Application bootstrap failed:', err);
  }
}

bootstrapApp();

// AI Studio always uses an `index.tsx` file for all project types.