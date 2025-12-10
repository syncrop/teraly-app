import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, query, where, getDocs, updateDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);

  // Obtener un usuario por su UID
  getUserById(uid: string): Observable<AppUser | null> {
    const userRef = doc(this.firestore, 'users', uid);
    
    return from(getDoc(userRef)).pipe(
      map((docSnapshot) => {
        if (docSnapshot.exists()) {
          return { ...docSnapshot.data(), uid: docSnapshot.id } as AppUser;
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error al obtener usuario:', error);
        return from([null]);
      })
    );
  }

  // Refrescar datos del usuario desde Firestore
  refreshUserData(userId: string): Observable<AppUser | null> {
    return this.getUserById(userId);
  }

  // Obtener lista de doctores desde Firestore
  getDoctors(): Observable<AppUser[]> {
    const usersRef = collection(this.firestore, 'users');
    const doctorsQuery = query(usersRef, where('role', '==', 'doctor'));

    return from(getDocs(doctorsQuery)).pipe(
      map((querySnapshot) => {
        const doctors: AppUser[] = [];
        querySnapshot.forEach((doc) => {
          doctors.push({ ...doc.data(), uid: doc.id } as AppUser);
        });
        return doctors;
      }),
      catchError((error) => {
        console.error('Error al obtener doctores:', error);
        return from([[]]);
      })
    );
  }

  // Obtener un doctor específico por su UID
  getDoctorById(uid: string): Observable<AppUser | null> {
    const doctorRef = doc(this.firestore, 'users', uid);
    
    return from(getDoc(doctorRef)).pipe(
      map((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data() as AppUser;
          // Verificar que sea un doctor
          if (userData.role === 'doctor') {
            return { ...userData, uid: docSnapshot.id };
          }
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error al obtener doctor:', error);
        return from([null]);
      })
    );
  }

  // Obtener lista de clientes desde Firestore
  getClients(): Observable<AppUser[]> {
    const usersRef = collection(this.firestore, 'users');
    const clientsQuery = query(usersRef, where('role', '==', 'client'));

    return from(getDocs(clientsQuery)).pipe(
      map((querySnapshot) => {
        const clients: AppUser[] = [];
        querySnapshot.forEach((doc) => {
          clients.push({ ...doc.data(), uid: doc.id } as AppUser);
        });
        return clients;
      }),
      catchError((error) => {
        console.error('Error al obtener clientes:', error);
        return from([[]]);
      })
    );
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
