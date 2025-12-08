import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { LOCALE_ID, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

import '@angular/localize/init';
import { loadTranslations } from '@angular/localize';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { TranslationService } from './src/services/translation.service';

async function bootstrapApp() {
  // --- Locale Detection ---
  const SUPPORTED_LOCALES = ['en', 'es', 'pl', 'uk'];
  let locale = 'en'; // Default locale
  let translationsData: { [key: string]: string } = {};

  const storedLang = localStorage.getItem('teraly-lang');
  const browserLang = navigator.language.split('-')[0];

  if (storedLang && SUPPORTED_LOCALES.includes(storedLang)) {
    locale = storedLang;
  } else if (browserLang && SUPPORTED_LOCALES.includes(browserLang)) {
    locale = browserLang;
  }

  // Load translations
  try {
    const response = await fetch(`/src/assets/i18n/${locale}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseText = await response.text();
    if (responseText === 'undefined') {
      throw new Error(`Received "undefined" as response for ${locale}.json`);
    }

    const translations = JSON.parse(responseText);
    translationsData = translations.translations || {};
    
    // Always load translations (including English) to ensure $localize works properly
    loadTranslations(translationsData);
  } catch (error) {
    console.error(`Failed to load translations for '${locale}'. Falling back to 'en'.`, error);
    locale = 'en';
    // Load English as fallback
    try {
      const response = await fetch(`/src/assets/i18n/en.json`);
      const translations = JSON.parse(await response.text());
      translationsData = translations.translations || {};
    } catch (e) {
      console.error('Failed to load English translations', e);
    }
  }

  // Bootstrap the application
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyCvyqo-Zh6wY0NZSQjth348SkfK2uJiO1U",
      authDomain: "teraly-ba.firebaseapp.com",
      projectId: "teraly-ba",
      storageBucket: "teraly-ba.firebasestorage.app",
      messagingSenderId: "898872869546",
      appId: "1:898872869546:web:5ef57de647b4a1f36b06d3",
      measurementId: "G-46NC9RWBCM",
    };

    await bootstrapApplication(AppComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(APP_ROUTES, withHashLocation()),
        provideHttpClient(),
        importProvidersFrom(ReactiveFormsModule),
        { provide: LOCALE_ID, useValue: locale },
        {
          provide: TranslationService,
          useFactory: () => {
            const service = new TranslationService();
            service.setTranslations(translationsData);
            return service;
          }
        },
        provideFirebaseApp(() => initializeApp(firebaseConfig)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage()),
      ],
    });
  } catch (err) {
    console.error('Application bootstrap failed:', err);
  }
}

bootstrapApp();

// AI Studio always uses an `index.tsx` file for all project types.