import { Injectable, signal } from '@angular/core';

export type UserRole = 'client' | 'doctor' | null;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUserRole = signal<UserRole>(null);

  constructor() {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'client' || storedRole === 'doctor') {
          this.currentUserRole.set(storedRole);
      }
  }

  login(email: string, password: string):boolean {
    if (password !== 'pass') {
      return false;
    }

    if (email.toLowerCase() === 'cliente@teraly.com') {
      this.currentUserRole.set('client');
      localStorage.setItem('userRole', 'client');
      return true;
    } else if (email.toLowerCase() === 'doctor@teraly.com') {
      this.currentUserRole.set('doctor');
      localStorage.setItem('userRole', 'doctor');
      return true;
    }

    return false;
  }

  logout() {
    this.currentUserRole.set(null);
    localStorage.removeItem('userRole');
  }
}
