import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, query, where, getDocs, updateDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppUser } from '../models/user.model';
import { FirestoreHelperService } from './firestore-helper.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly firestore = inject(Firestore);
  private readonly firestoreHelper = inject(FirestoreHelperService);

  // Obtener un usuario por su UID
  getUserById(uid: string): Observable<AppUser | null> {
    return from(this.firestoreHelper.getDocument<AppUser>('users', uid));
  }

  // Refrescar datos del usuario desde Firestore
  refreshUserData(userId: string): Observable<AppUser | null> {
    return this.getUserById(userId);
  }

  // Obtener lista de doctores desde Firestore
  getDoctors(): Observable<AppUser[]> {
    return from(this.firestoreHelper.getDocuments<AppUser>('users', where('role', '==', 'doctor')));
  }

  // Obtener un doctor específico por su UID
  getDoctorById(uid: string): Observable<AppUser | null> {
    return from(this.firestoreHelper.getDocument<AppUser>('users', uid)).pipe(
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
    return from(this.firestoreHelper.getDocuments<AppUser>('users', where('role', '==', 'client')));
  }

  // Actualizar la foto de perfil del usuario en Firestore
  updateProfilePicture(userId: string, photoURL: string): Observable<boolean> {
    const userRef = doc(this.firestore, 'users', userId);
    
    return from(updateDoc(userRef, { photoURL })).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error al actualizar foto de perfil:', error);
        return from([false]);
      })
    );
  }

  // Eliminar la foto de perfil del usuario en Firestore
  removeProfilePicture(userId: string): Observable<boolean> {
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
