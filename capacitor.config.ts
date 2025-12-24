/// <reference types="@capacitor-firebase/authentication" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teraly.app',
  appName: 'Teraly',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'automatic'
  },
  plugins: {
    StatusBar: {
      style: 'Light',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['apple.com']
    }
  }
};

export default config;