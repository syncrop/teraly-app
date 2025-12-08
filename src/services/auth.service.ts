import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, user } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { TokenStorageService } from './token-storage.service';
import { AuthErrorHandler } from '../utils/auth-error-handler';

export type UserRole = 'client' | 'doctor' | null;

export interface AppUser {
  uid: string;
  email: string;
  fullName: string;
  role: 'client' | 'doctor';
  createdAt: any;
  specialty?: string;
  licenseNumber?: string;
  isVerified?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private tokenStorage = inject(TokenStorageService);
  
  currentUserRole = signal<UserRole>(null);
  currentUser = signal<AppUser | null>(null);

  constructor() {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'client' || storedRole === 'doctor') {
      this.currentUserRole.set(storedRole as UserRole);
    }
  }

  // Login con Firebase
  login(email: string, password: string): Observable<{ success: boolean; role?: UserRole; error?: string }> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      // Use switchMap to handle the promise and emit the correct type
      // Import switchMap from 'rxjs/operators' if not already imported
      // Replace 'map(async ...)' with 'switchMap'
      // If switchMap is not imported, add: import { map, catchError, switchMap } from 'rxjs/operators';
      switchMap((credential) =>
        from(credential.user.getIdTokenResult()).pipe(
          switchMap((tokenResult) =>
            from(getDoc(doc(this.firestore, 'users', credential.user.uid))).pipe(
              map((userDoc) => {
                const userData = userDoc.data() as AppUser;
                if (userData) {
                  const role: UserRole = userData.role === 'doctor' ? 'doctor' : 'client';
                  this.currentUserRole.set(role);
                  this.currentUser.set(userData);
                  localStorage.setItem('userRole', role);
                  localStorage.setItem('userId', credential.user.uid);

                  // Store session token details using TokenStorageService
                  const idToken = (tokenResult && (tokenResult.token as string)) || '';
                  const expiresAt = tokenResult && tokenResult.expirationTime 
                    ? new Date(tokenResult.expirationTime).getTime() 
                    : (Date.now() + 3600 * 1000);
                  const refreshToken = (credential.user as any)?.refreshToken || '';
                  
                  this.tokenStorage.storeTokens({
                    idToken,
                    refreshToken,
                    expiresAt,
                    localId: credential.user.uid,
                    email: credential.user.email || ''
                  });

                  return { success: true, role };
                }
                return { success: false, error: 'Usuario no encontrado en la base de datos' };
              })
            )
          )
        )
      ),
      catchError((error) => {
        const errorMessage = AuthErrorHandler.getLoginErrorMessage(error.code);
        return from([{ success: false, error: errorMessage }]);
      })
    );
  }

  // Registro con Firebase
  register(email: string, password: string, fullName: string, userType: 'client' | 'doctor', licenseNumber?: string): Observable<{ success: boolean; uid?: string; error?: string }> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((credential) =>
        from((async () => {
          const uid = credential.user.uid;
          const userRef = doc(this.firestore, 'users', uid);
          
          const userData: AppUser = {
            uid,
            email,
            fullName,
            role: userType,
            createdAt: new Date(),
            isVerified: userType === 'client',
            ...(userType === 'doctor' && { 
              licenseNumber, 
              isVerified: false,
              specialty: ''
            })
          };
          
          await setDoc(userRef, userData);
          this.currentUserRole.set(userType);
          this.currentUser.set(userData);
          localStorage.setItem('userRole', userType);
          localStorage.setItem('userId', uid);

          // Store session token details using TokenStorageService
          try {
            const tokenResult = await credential.user.getIdTokenResult();
            const idToken = tokenResult?.token || '';
            const expiresAt = tokenResult && tokenResult.expirationTime 
              ? new Date(tokenResult.expirationTime).getTime() 
              : (Date.now() + 3600 * 1000);
            const refreshToken = (credential.user as any)?.refreshToken || '';
            
            this.tokenStorage.storeTokens({
              idToken,
              refreshToken,
              expiresAt,
              localId: uid,
              email: credential.user.email || email || ''
            });
          } catch (e) {
            console.warn('Could not store session tokens on register', e);
          }

          return { success: true, uid };
        })())
      ),
      catchError((error) => {
        const errorMessage = AuthErrorHandler.getRegisterErrorMessage(error.code);
        return [{ success: false, error: errorMessage }];
      })
    );
  }

  // Recuperar contraseña
  resetPassword(email: string): Observable<{ success: boolean; error?: string }> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      map(() => ({ success: true })),
      catchError((error) => {
        const errorMessage = AuthErrorHandler.getPasswordResetErrorMessage(error.code);
        return [{ success: false, error: errorMessage }];
      })
    );
  }

  // Logout con Firebase
  logout(): void {
    signOut(this.auth).then(() => {
      // Limpiar signals
      this.currentUserRole.set(null);
      this.currentUser.set(null);
      
      // Limpiar localStorage
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      
      // Limpiar sessionStorage using TokenStorageService
      this.tokenStorage.clearTokens();
      
      // Redirigir al login
      this.router.navigate(['/login']);
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
      // Intentar limpiar de todas formas
      this.currentUserRole.set(null);
      this.currentUser.set(null);
      this.router.navigate(['/login']);
    });
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.currentUserRole() !== null;
  }

  // Obtener el usuario actual
  getCurrentUser(): Observable<AppUser | null> {
    return from(user(this.auth)).pipe(
      switchMap((firebaseUser) => {
        if (firebaseUser) {
          return from(getDoc(doc(this.firestore, 'users', firebaseUser.uid))).pipe(
            map((userDoc) => userDoc.data() as AppUser)
          );
        }
        return from([null]);
      }),
      catchError(() => from([null]))
    );
  }
}
