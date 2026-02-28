export const BACKEND_CONFIG = {
  /**
   * When false, the app keeps using Firestore directly (current behavior).
   * Flip to true only once Cloud Run + Mongo backend is ready.
   */
  enabled: false,

  /**
   * Cloud Run base URL, e.g. https://api-xxxxx-uc.a.run.app
   * Keep empty until backend is deployed.
   */
  apiBaseUrl: '',
} as const;
