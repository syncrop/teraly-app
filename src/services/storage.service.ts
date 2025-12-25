import { Injectable, inject } from '@angular/core';
import { 
  Storage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from '@angular/fire/storage';
import { Observable, from, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage = inject(Storage);

  /**
   * Sube una imagen de perfil a Firebase Storage
   * @param file - Archivo de imagen a subir
   * @param userId - ID del usuario
   * @returns Observable con la URL de descarga
   */
  uploadProfilePicture(file: File, userId: string): Observable<string> {
    const filePath = `profile-pictures/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);

    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(() => getDownloadURL(storageRef))
    );
  }

  /**
   * Elimina una imagen de perfil de Firebase Storage
   * @param photoURL - URL de la imagen a eliminar
   * @returns Observable<void>
   */
  deleteProfilePicture(photoURL: string): Observable<void> {
    try {
      const storageRef = ref(this.storage, photoURL);
      return from(deleteObject(storageRef));
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      return from(Promise.resolve());
    }
  }

  /**
   * Sube cualquier tipo de archivo a Firebase Storage
   * @param file - Archivo a subir
   * @param path - Ruta en Firebase Storage
   * @returns Observable con la URL de descarga
   */
  uploadFile(file: File, path: string): Observable<string> {
    const storageRef = ref(this.storage, path);

    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(() => getDownloadURL(storageRef))
    );
  }
}
