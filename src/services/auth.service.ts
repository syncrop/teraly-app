import { Injectable, signal, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, user } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

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
        from(getDoc(doc(this.firestore, 'users', credential.user.uid))).pipe(
          map((userDoc) => {
            const userData = userDoc.data() as AppUser;
            if (userData) {
              const role: UserRole = userData.role === 'doctor' ? 'doctor' : 'client';
              this.currentUserRole.set(role);
              this.currentUser.set(userData);
              localStorage.setItem('userRole', role);
              localStorage.setItem('userId', credential.user.uid);
              return { success: true, role };
            }
            return { success: false, error: 'Usuario no encontrado en la base de datos' };
          })
        )
      ),
      catchError((error) => {
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
          
          return { success: true, uid };
        })())
      ),
      catchError((error) => {
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

  // Logout
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      map(() => {
        this.currentUserRole.set(null);
        this.currentUser.set(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
      }),
      catchError((error) => {
        console.error('Error al cerrar sesión:', error);
        return [undefined];
      })
    );
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
