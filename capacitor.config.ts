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
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      showSpinner: false
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#4338CA',
      overlaysWebView: false
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['apple.com']
    }
  }
};

export default config;