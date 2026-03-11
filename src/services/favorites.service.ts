import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FirestoreHelperService } from './firestore-helper.service';
import { isBackendEnabled } from '../config/backend.config';
import { FavoritesApiService } from './favorites-api.service';

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
  private favoritesApi = inject(FavoritesApiService);

  // Agregar doctor a favoritos
  addFavorite(userId: string, doctorId: string): Observable<boolean> {
    if (isBackendEnabled()) {
      // userId is ignored; backend uses the authenticated user
      return this.favoritesApi.addFavorite(doctorId).pipe(
        map((r) => !!r?.success),
        catchError((error) => {
          console.error('Error al agregar favorito (backend):', error);
          return from([false]);
        })
      );
    }

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
    if (isBackendEnabled()) {
      // userId is ignored; backend uses the authenticated user
      return this.favoritesApi.removeFavorite(doctorId).pipe(
        map((r) => !!r?.success),
        catchError((error) => {
          console.error('Error al eliminar favorito (backend):', error);
          return from([false]);
        })
      );
    }

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
    if (isBackendEnabled()) {
      // userId is ignored; backend uses the authenticated user
      return this.favoritesApi.isFavorite(doctorId).pipe(
        map((r) => !!r?.isFavorite),
        catchError((error) => {
          console.error('Error al verificar favorito (backend):', error);
          return from([false]);
        })
      );
    }

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
    if (isBackendEnabled()) {
      // userId is ignored; backend uses the authenticated user
      return this.favoritesApi.listMyFavorites().pipe(
        map((r) => r?.doctorIds ?? []),
        catchError((error) => {
          console.error('Error al obtener favoritos (backend):', error);
          return from([[]]);
        })
      );
    }

    return from(this.firestoreHelper.getDocuments<Favorite>('favorites', where('userId', '==', userId))).pipe(
      map((favorites) => favorites.map(fav => fav.doctorId)),
      catchError((error) => {
        console.error('Error al obtener favoritos:', error);
        return from([[]]);
      })
    );
  }
}
