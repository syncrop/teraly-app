import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FirestoreHelperService } from './firestore-helper.service';

export interface Favorite {
  userId: string;
  doctorId: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private firestore = inject(Firestore);
  private firestoreHelper = inject(FirestoreHelperService);

  // Agregar doctor a favoritos
  addFavorite(userId: string, doctorId: string): Observable<boolean> {
    const favoriteId = `${userId}_${doctorId}`;
    const favoriteRef = doc(this.firestore, 'favorites', favoriteId);
    
    const favoriteData: Favorite = {
      userId,
      doctorId,
      createdAt: new Date()
    };

    return from(setDoc(favoriteRef, favoriteData)).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error al agregar favorito:', error);
        return from([false]);
      })
    );
  }

  // Eliminar doctor de favoritos
  removeFavorite(userId: string, doctorId: string): Observable<boolean> {
    const favoriteId = `${userId}_${doctorId}`;
    const favoriteRef = doc(this.firestore, 'favorites', favoriteId);

    return from(deleteDoc(favoriteRef)).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error al eliminar favorito:', error);
        return from([false]);
      })
    );
  }

  // Verificar si un doctor está en favoritos
  isFavorite(userId: string, doctorId: string): Observable<boolean> {
    const favoriteId = `${userId}_${doctorId}`;
    return from(this.firestoreHelper.getDocument<Favorite>('favorites', favoriteId)).pipe(
      map((doc) => doc !== null),
      catchError((error) => {
        console.error('Error al verificar favorito:', error);
        return from([false]);
      })
    );
  }

  // Obtener todos los favoritos de un usuario
  getUserFavorites(userId: string): Observable<string[]> {
    return from(this.firestoreHelper.getDocuments<Favorite>('favorites', where('userId', '==', userId))).pipe(
      map((favorites) => favorites.map(fav => fav.doctorId)),
      catchError((error) => {
        console.error('Error al obtener favoritos:', error);
        return from([[]]);
      })
    );
  }
}
