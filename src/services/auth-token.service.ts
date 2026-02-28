import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

@Injectable({
  providedIn: 'root',
})
export class AuthTokenService {
  private readonly auth = inject(Auth);

  async getIdToken(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.getIdToken();
        return result.token || null;
      }

      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        return localStorage.getItem('idToken');
      }

      return await currentUser.getIdToken();
    } catch {
      return localStorage.getItem('idToken');
    }
  }
}
