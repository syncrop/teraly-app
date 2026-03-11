export type BackendConfig = Readonly<{
  enabled: boolean;
  apiBaseUrl: string;
}>;

// Defaults for local dev. Override without rebuild using localStorage:
// - localStorage.setItem('teraly.backend.enabled', 'true' | 'false')
// - localStorage.setItem('teraly.backend.apiBaseUrl', 'http://localhost:8080')
const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  enabled: true,
  apiBaseUrl: 'http://localhost:8080',
};

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return undefined;
}

export function getBackendConfig(): BackendConfig {
  const enabledOverride = parseBoolean(safeLocalStorageGet('teraly.backend.enabled'));
  const apiBaseUrlOverride = safeLocalStorageGet('teraly.backend.apiBaseUrl');

  const enabled = enabledOverride ?? DEFAULT_BACKEND_CONFIG.enabled;
  const apiBaseUrl = (apiBaseUrlOverride ?? DEFAULT_BACKEND_CONFIG.apiBaseUrl).trim();

  return { enabled, apiBaseUrl };
}

export function isBackendEnabled(): boolean {
  return getBackendConfig().enabled;
}

export function getBackendApiBaseUrl(): string {
  return getBackendConfig().apiBaseUrl.replace(/\/$/, '');
}

/**
 * Backwards-compatible export (avoid using directly in new code).
 * Prefer getBackendConfig()/isBackendEnabled() so overrides work.
 */
export const BACKEND_CONFIG: BackendConfig = DEFAULT_BACKEND_CONFIG;
