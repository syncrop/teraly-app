import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  /**
   * Tomar foto con la cámara
   */
  async takePhoto(): Promise<Photo | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      return image;
    } catch (error) {
      console.error('Error al tomar foto:', error);
      return null;
    }
  }

  /**
   * Seleccionar foto de la galería
   */
  async pickPhoto(): Promise<Photo | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });
      
      return image;
    } catch (error) {
      console.error('Error al seleccionar foto:', error);
      return null;
    }
  }

  /**
   * Mostrar opciones: Cámara o Galería
   */
  async selectPhoto(): Promise<Photo | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt, // Muestra diálogo con opciones
        promptLabelHeader: 'Foto de perfil',
        promptLabelPhoto: 'Seleccionar de galería',
        promptLabelPicture: 'Tomar foto'
      });
      
      return image;
    } catch (error) {
      console.error('Error al seleccionar foto:', error);
      return null;
    }
  }

  /**
   * Convertir foto a base64 para subir a Firebase Storage
   */
  async photoToBase64(photo: Photo): Promise<string | null> {
    try {
      if (photo.dataUrl) {
        return photo.dataUrl;
      }

      if (photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      return null;
    } catch (error) {
      console.error('Error al convertir foto a base64:', error);
      return null;
    }
  }
}
