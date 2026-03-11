import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, query, where, getDocs, updateDoc } from '@angular/fire/firestore';
import { Capacitor } from '@capacitor/core';
import { FirestoreNativeService } from './firestore-native.service';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppUser } from '../models/user.model';
import { FirestoreHelperService } from './firestore-helper.service';
import { isBackendEnabled } from '../config/backend.config';
import { UsersApiService } from './users-api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly firestore = inject(Firestore);
  private readonly firestoreHelper = inject(FirestoreHelperService);
  private readonly firestoreNative = inject(FirestoreNativeService);
  private readonly usersApi = inject(UsersApiService);

  // Obtener un usuario por su UID
  getUserById(uid: string): Observable<AppUser | null> {
    if (isBackendEnabled()) {
      return this.usersApi.getUserById(uid);
    }

    return from(this.firestoreHelper.getDocument<AppUser>('users', uid));
  }

  // Refrescar datos del usuario desde Firestore
  refreshUserData(userId: string): Observable<AppUser | null> {
    return this.getUserById(userId);
  }

  // Obtener lista de doctores desde Firestore
  getDoctors(): Observable<AppUser[]> {
    if (isBackendEnabled()) {
      return this.usersApi.listUsersByRole('doctor');
    }

    return from(this.firestoreHelper.getDocuments<AppUser>('users', where('role', '==', 'doctor')));
  }

  // Obtener un doctor específico por su UID
  getDoctorById(uid: string): Observable<AppUser | null> {
    return this.getUserById(uid).pipe(
      map((userData) => {
        // Verificar que sea un doctor
        if (userData && userData.role === 'doctor') {
          return userData;
        }
        return null;
      })
    );
  }

  // Obtener lista de clientes desde Firestore
  getClients(): Observable<AppUser[]> {
    if (isBackendEnabled()) {
      return this.usersApi.listUsersByRole('client');
    }

    return from(this.firestoreHelper.getDocuments<AppUser>('users', where('role', '==', 'client')));
  }

  // Actualizar la foto de perfil del usuario en Firestore
  updateProfilePicture(userId: string, photoURL: string): Observable<boolean> {
    if (isBackendEnabled()) {
      // Backend decides authorization (owner-only)
      return this.usersApi.updateMyProfilePicture(photoURL).pipe(
        map((r) => !!r?.success),
        catchError((error) => {
          console.error('Error al actualizar foto de perfil (backend):', error);
          return from([false]);
        })
      );
    }

    if (Capacitor.isNativePlatform()) {
      // Usar REST API en iOS/Android
      return from(this.firestoreNative.updateDocument('users', userId, { photoURL })).pipe(
        map((result) => !!result),
        catchError((error) => {
          console.error('Error al actualizar foto de perfil (nativo):', error);
          return from([false]);
        })
      );
    } else {
      // Usar SDK web en web
      const userRef = doc(this.firestore, 'users', userId);
      return from(updateDoc(userRef, { photoURL })).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Error al actualizar foto de perfil:', error);
          return from([false]);
        })
      );
    }
  }

  // Eliminar la foto de perfil del usuario en Firestore
  removeProfilePicture(userId: string): Observable<boolean> {
    if (isBackendEnabled()) {
      return this.usersApi.removeMyProfilePicture().pipe(
        map((r) => !!r?.success),
        catchError((error) => {
          console.error('Error al eliminar foto de perfil (backend):', error);
          return from([false]);
        })
      );
    }

    const userRef = doc(this.firestore, 'users', userId);
    
    return from(updateDoc(userRef, { photoURL: null })).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error al eliminar foto de perfil:', error);
        return from([false]);
      })
    );
  }
}
