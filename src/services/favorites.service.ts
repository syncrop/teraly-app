import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
    const favoriteRef = doc(this.firestore, 'favorites', favoriteId);

    return from(getDoc(favoriteRef)).pipe(
      map((docSnapshot) => docSnapshot.exists()),
      catchError((error) => {
        console.error('Error al verificar favorito:', error);
        return from([false]);
      })
    );
  }

  // Obtener todos los favoritos de un usuario
  getUserFavorites(userId: string): Observable<string[]> {
    const favoritesRef = collection(this.firestore, 'favorites');
    const favoritesQuery = query(favoritesRef, where('userId', '==', userId));

    return from(getDocs(favoritesQuery)).pipe(
      map((querySnapshot) => {
        const doctorIds: string[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Favorite;
          doctorIds.push(data.doctorId);
        });
        return doctorIds;
      }),
      catchError((error) => {
        console.error('Error al obtener favoritos:', error);
        return from([[]]);
      })
    );
  }
}
