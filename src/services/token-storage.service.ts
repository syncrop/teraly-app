import { Injectable } from '@angular/core';

export interface TokenData {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  localId: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  
  /**
   * Stores authentication tokens in sessionStorage
   */
  storeTokens(tokenData: Partial<TokenData>): void {
    try {
      if (tokenData.idToken) sessionStorage.setItem('idToken', tokenData.idToken);
      if (tokenData.refreshToken) sessionStorage.setItem('refreshToken', tokenData.refreshToken);
      if (tokenData.expiresAt) sessionStorage.setItem('expiresAt', String(tokenData.expiresAt));
      if (tokenData.localId) sessionStorage.setItem('localId', tokenData.localId);
      if (tokenData.email) sessionStorage.setItem('email', tokenData.email);
    } catch (e) {
      console.warn('Could not store session tokens', e);
    }
  }

  /**
   * Clears all authentication tokens from sessionStorage
   */
  clearTokens(): void {
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('expiresAt');
    sessionStorage.removeItem('localId');
    sessionStorage.removeItem('email');
  }

  /**
   * Gets the stored ID token
   */
  getIdToken(): string | null {
    return sessionStorage.getItem('idToken');
  }

  /**
   * Gets the stored refresh token
   */
  getRefreshToken(): string | null {
    return sessionStorage.getItem('refreshToken');
  }

  /**
   * Checks if the token is expired
   */
  isTokenExpired(): boolean {
    const expiresAt = sessionStorage.getItem('expiresAt');
    if (!expiresAt) return true;
    return Date.now() >= parseInt(expiresAt, 10);
  }
}
