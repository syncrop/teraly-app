import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, user } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { UserRole, AppUser } from '../models/user.model';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirestoreHelperService } from './firestore-helper.service';
import { LoaderService } from './loader.service';
import { BACKEND_CONFIG } from '../config/backend.config';
import { UsersApiService } from './users-api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private firestoreHelper = inject(FirestoreHelperService);
  private loaderService = inject(LoaderService);
  private usersApi = inject(UsersApiService);
  
  currentUserRole = signal<UserRole>(null);
  currentUser = signal<AppUser | null>(null);
  isInitialized = signal<boolean>(false);
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'client' || storedRole === 'doctor') {
      this.currentUserRole.set(storedRole as UserRole);
    }
    
    // Inicializar el usuario actual si hay una sesión activa
    this.initializationPromise = this.initializeCurrentUser();
  }

  /**
   * Esperar a que el servicio termine de inicializarse
   */
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Helper para obtener documento de Firestore que funciona en web e iOS
   */
  private async getFirestoreUser(uid: string): Promise<AppUser | null> {
    try {
      // Crear una promesa con timeout de 10 segundos
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de 10s al obtener usuario de Firestore')), 10000);
      });

      // Ejecutar con timeout
      const userData = await Promise.race([
        this.firestoreHelper.getDocument<AppUser>('users', uid),
        timeoutPromise
      ]);
      
      return userData;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Perfil del usuario (durante la migración):
   * - Backend (Cloud Run + Mongo) cuando BACKEND_CONFIG.enabled=true
   * - Firestore mientras BACKEND_CONFIG.enabled=false
   */
  private async getUserProfile(uid: string): Promise<AppUser | null> {
    if (BACKEND_CONFIG.enabled) {
      try {
        // Prefer /me when possible; fallback to /users/:uid for bootstrap scenarios.
        const me = await firstValueFrom(this.usersApi.getMe().pipe(catchError(() => of(null))));
        if (me) return me;
        return await firstValueFrom(this.usersApi.getUserById(uid).pipe(catchError(() => of(null))));
      } catch {
        return null;
      }
    }

    return this.getFirestoreUser(uid);
  }

  /**
   * Inicializar el usuario actual desde Firebase Auth
   */
  private async initializeCurrentUser(): Promise<void> {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const userData = await this.getUserProfile(userId);
        
        if (userData) {
          this.currentUser.set(userData);
        } else {
          localStorage.removeItem('userId');
          localStorage.removeItem('userRole');
          localStorage.removeItem('idToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('expiresAt');
          localStorage.removeItem('localId');
          localStorage.removeItem('email');
          this.currentUserRole.set(null);
          this.currentUser.set(null);
        }
      }
    } catch (error) {
      this.currentUserRole.set(null);
      this.currentUser.set(null);
    } finally {
      this.isInitialized.set(true);
    }
  }

  // Login con Firebase
  login(email: string, password: string): Observable<{ success: boolean; role?: UserRole; error?: string }> {
    this.loaderService.show();
    
    // Usar plugin nativo en iOS/Android
    if (Capacitor.isNativePlatform()) {
      return from(
        (async () => {
          try {
            const result = await FirebaseAuthentication.signInWithEmailAndPassword({ email, password });
            
            const uid = result.user?.uid;
            
            if (!uid) {
              return { success: false, error: 'No se pudo obtener el UID del usuario' };
            }
            
            const userData = await this.getUserProfile(uid);
            
            if (!userData) {
              await FirebaseAuthentication.signOut();
              this.loaderService.hide();
              return { success: false, error: 'Usuario no encontrado en la base de datos. Por favor, regístrate primero.' };
            }
            
            const role: UserRole = userData.role === 'doctor' ? 'doctor' : 'client';
            this.currentUserRole.set(role);
            this.currentUser.set(userData);
            localStorage.setItem('userRole', role);
            localStorage.setItem('userId', uid);
            
            this.loaderService.hide();
            return { success: true, role };
          } catch (error: any) {
            this.loaderService.hide();
            let errorMessage = 'Error al iniciar sesión';
            if (error.code === 'auth/user-not-found') {
              errorMessage = 'Usuario no encontrado';
            } else if (error.code === 'auth/wrong-password') {
              errorMessage = 'Contraseña incorrecta';
            } else if (error.code === 'auth/invalid-email') {
              errorMessage = 'Email inválido';
            }
            return { success: false, error: errorMessage };
          }
        })()
      );
    }
    
    // Usar @angular/fire en web
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((credential) =>
        from(
          (async () => {
            const uid = credential.user.uid;

            // Guardar tokens cuanto antes (si falla, no debe romper login)
            try {
              const tokenResult = await credential.user.getIdTokenResult();
              const idToken = tokenResult?.token || '';
              const expiresAt = tokenResult?.expirationTime
                ? new Date(tokenResult.expirationTime).getTime()
                : Date.now() + 3600 * 1000;
              const refreshToken = (credential.user as any)?.refreshToken || '';
              localStorage.setItem('idToken', idToken);
              localStorage.setItem('refreshToken', refreshToken);
              localStorage.setItem('expiresAt', String(expiresAt));
              localStorage.setItem('localId', uid);
              localStorage.setItem('email', credential.user.email || '');
            } catch (e) {
              console.warn('Could not store session tokens', e);
            }

            let userData: AppUser | null = null;

            if (BACKEND_CONFIG.enabled) {
              userData = await this.getUserProfile(uid);
              if (!userData) {
                await signOut(this.auth);
                return {
                  success: false,
                  error: 'Tu cuenta existe en Auth, pero falta tu perfil en el backend. Regístrate o contacta soporte.'
                };
              }
            } else {
              // Recuperar perfil de Firestore (si no existe o no hay permisos, devolvemos error explícito)
              let userDoc;
              try {
                userDoc = await getDoc(doc(this.firestore, 'users', uid));
              } catch (e: any) {
                const code = e?.code as string | undefined;
                if (code === 'permission-denied') {
                  return {
                    success: false,
                    error: 'No tienes permisos para leer tu perfil (Firestore rules).'
                  };
                }

                return {
                  success: false,
                  error: 'No se pudo leer tu perfil de usuario. Intenta de nuevo.'
                };
              }

              if (!userDoc.exists()) {
                await signOut(this.auth);
                return {
                  success: false,
                  error: 'Tu cuenta existe en Auth, pero falta tu perfil en Firestore. Regístrate o contacta soporte.'
                };
              }

              userData = userDoc.data() as AppUser;
            }

            const role: UserRole = userData?.role === 'doctor' ? 'doctor' : 'client';
            this.currentUserRole.set(role);
            this.currentUser.set(userData);
            localStorage.setItem('userRole', role);
            localStorage.setItem('userId', uid);
            return { success: true, role };
          })()
        )
      ),
      finalize(() => this.loaderService.hide()),
      catchError((error) => {
        let errorMessage = 'Error al iniciar sesión';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Usuario no encontrado';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Contraseña incorrecta';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        }
        return of({ success: false, error: errorMessage });
      })
    );
  }

  // Registro con Firebase
  register(email: string, password: string, fullName: string, userType: 'client' | 'doctor', licenseNumber?: string, languages?: string[]): Observable<{ success: boolean; uid?: string; error?: string }> {
    this.loaderService.show();
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((credential) =>
        from((async () => {
          const uid = credential.user.uid;
          
          const userData: AppUser = {
            uid,
            email,
            fullName,
            role: userType,
            createdAt: new Date(),
            isVerified: userType === 'client',
            languages: languages || [],
            ...(userType === 'doctor' && { 
              isVerified: false,
              specialty: '',
              completed: false
            })
          };

          if (BACKEND_CONFIG.enabled) {
            // Create profile in backend (Cloud Run + Mongo).
            await firstValueFrom(this.usersApi.upsertMe(userData));
          } else {
            const userRef = doc(this.firestore, 'users', uid);
            await setDoc(userRef, userData);
          }

          this.currentUserRole.set(userType);
          this.currentUser.set(userData);
          localStorage.setItem('userRole', userType);
          localStorage.setItem('userId', uid);

          // store session token details (idToken, refreshToken, expiresAt, localId, email)
          try {
            const tokenResult = await credential.user.getIdTokenResult();
            const idToken = tokenResult?.token || '';
            const expiresAt = tokenResult && tokenResult.expirationTime ? new Date(tokenResult.expirationTime).getTime() : (Date.now() + 3600 * 1000);
            const refreshToken = (credential.user as any)?.refreshToken || '';
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('expiresAt', String(expiresAt));
            localStorage.setItem('localId', uid);
            localStorage.setItem('email', credential.user.email || email || '');
          } catch (e) {
            // Error al guardar tokens
          }

          this.loaderService.hide();
          return { success: true, uid };
        })())
      ),
      catchError((error) => {
        this.loaderService.hide();
        let errorMessage = 'Error al registrar';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'El email ya está registrado';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'La contraseña es muy débil';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        }
        return [{ success: false, error: errorMessage }];
      })
    );
  }

  // Recuperar contraseña
  resetPassword(email: string): Observable<{ success: boolean; error?: string }> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      map(() => ({ success: true })),
      catchError((error) => {
        let errorMessage = 'Error al enviar email de recuperación';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Usuario no encontrado';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        }
        return [{ success: false, error: errorMessage }];
      })
    );
  }

  // Logout con Firebase
  async logout(): Promise<void> {
    try {
      // Limpiar signals primero
      this.currentUserRole.set(null);
      this.currentUser.set(null);
      
      // Limpiar localStorage
      localStorage.clear();
      
      // Cerrar sesión en Firebase
      if (Capacitor.isNativePlatform()) {
        // iOS/Android: Usar plugin nativo
        await FirebaseAuthentication.signOut();
      } else {
        // Web: Usar SDK normal
        await signOut(this.auth);
      }
      
      // Forzar navegación completa al login
      if (Capacitor.isNativePlatform()) {
        // En iOS/Android, forzar recarga completa
        window.location.href = '/login';
      } else {
        // En web, usar router
        await this.router.navigate(['/login'], { replaceUrl: true });
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Intentar limpiar de todas formas
      this.currentUserRole.set(null);
      this.currentUser.set(null);
      localStorage.clear();
      
      // Forzar navegación aunque haya error
      if (Capacitor.isNativePlatform()) {
        window.location.href = '/login';
      } else {
        await this.router.navigate(['/login'], { replaceUrl: true });
      }
    }
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.currentUserRole() !== null;
  }

  // Obtener el UID del usuario actual desde sessionStorage o signal
  getCurrentUserId(): string | null {
    // Primero intentar desde el signal (más rápido)
    const currentUser = this.currentUser();
    if (currentUser?.uid) {
      return currentUser.uid;
    }

    // Fallback a localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      return userId;
    }

    // Fallback a localStorage (donde guardas localId al hacer login)
    const localId = localStorage.getItem('localId');
    if (localId) {
      return localId;
    }

    return null;
  }

  // Obtener el usuario actual
  getCurrentUser(): Observable<AppUser | null> {
    if (Capacitor.isNativePlatform()) {
      // iOS/Android: Obtener UID y usar helper
      const userId = this.getCurrentUserId();
      if (!userId) {
        return from([null]);
      }
      return from(this.getFirestoreUser(userId));
    }
    
    // Web: Usar SDK normal
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
