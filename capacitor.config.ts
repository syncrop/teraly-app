/// <reference types="@capacitor-firebase/authentication" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teraly.app',
  appName: 'Teraly',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    allowsBackForwardNavigationGestures: true
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