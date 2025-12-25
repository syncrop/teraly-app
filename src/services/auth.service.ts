import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, user } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { UserRole, AppUser } from '../models/user.model';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirestoreHelperService } from './firestore-helper.service';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private firestoreHelper = inject(FirestoreHelperService);
  private loaderService = inject(LoaderService);
  
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
   * Inicializar el usuario actual desde Firebase Auth
   */
  private async initializeCurrentUser(): Promise<void> {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const userData = await this.getFirestoreUser(userId);
        
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
            
            const userData = await this.getFirestoreUser(uid);
            
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
      tap(() => {
        this.loaderService.hide();
      }),
      // Use switchMap to handle the promise and emit the correct type
      // Import switchMap from 'rxjs/operators' if not already imported
      // Replace 'map(async ...)' with 'switchMap'
      // If switchMap is not imported, add: import { map, catchError, switchMap } from 'rxjs/operators';
      switchMap((credential) =>
        from(credential.user.getIdTokenResult()).pipe(
          switchMap((tokenResult) =>
            from(getDoc(doc(this.firestore, 'users', credential.user.uid))).pipe(
              switchMap(async (userDoc) => {
                const userData = userDoc.data() as AppUser;
                if (userData) {
                  const role: UserRole = userData.role === 'doctor' ? 'doctor' : 'client';
                  this.currentUserRole.set(role);
                  this.currentUser.set(userData);
                  localStorage.setItem('userRole', role);
                  localStorage.setItem('userId', credential.user.uid);

                  // store session token details
                  try {
                    const idToken = (tokenResult && (tokenResult.token as string)) || '';
                    const expiresAt = tokenResult && tokenResult.expirationTime ? new Date(tokenResult.expirationTime).getTime() : (Date.now() + 3600 * 1000);
                    const refreshToken = (credential.user as any)?.refreshToken || '';
                    localStorage.setItem('idToken', idToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    localStorage.setItem('expiresAt', String(expiresAt));
                    localStorage.setItem('localId', credential.user.uid);
                    localStorage.setItem('email', credential.user.email || '');
                  } catch (e) {
                    // swallow storage errors
                    console.warn('Could not store session tokens', e);
                  }

                  return { success: true, role };
                }
                
                // Usuario no encontrado en Firestore, hacer logout de Firebase Auth
                await signOut(this.auth);
                return { success: false, error: 'Usuario no encontrado en la base de datos. Por favor, regístrate primero.' };
              })
            )
          )
        )
      ),
      catchError((error) => {
        this.loaderService.hide();
        let errorMessage = 'Error al iniciar sesión';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Usuario no encontrado';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Contraseña incorrecta';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido';
        }
        return from([{ success: false, error: errorMessage }]);
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
          const userRef = doc(this.firestore, 'users', uid);
          
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
          
          await setDoc(userRef, userData);
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
