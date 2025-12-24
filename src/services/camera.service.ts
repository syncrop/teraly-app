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
      // Solicitar permisos explícitamente antes de abrir la cámara
      const permissions = await Camera.checkPermissions();
      
      if (permissions.camera === 'denied' || permissions.photos === 'denied') {
        // Si los permisos fueron denegados, solicitar de nuevo
        const requestResult = await Camera.requestPermissions();
        
        if (requestResult.camera === 'denied' || requestResult.photos === 'denied') {
          throw new Error('Permisos denegados. Por favor, habilita los permisos en Configuración.');
        }
      } else if (permissions.camera === 'prompt' || permissions.photos === 'prompt') {
        // Si es la primera vez, solicitar permisos
        const requestResult = await Camera.requestPermissions();
        
        if (requestResult.camera === 'denied' || requestResult.photos === 'denied') {
          throw new Error('Permisos denegados. Por favor, habilita los permisos en Configuración.');
        }
      }
      
      // Ahora sí, abrir la cámara/galería
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Foto de perfil',
        promptLabelPhoto: 'Seleccionar de galería',
        promptLabelPicture: 'Tomar foto',
        width: 800,
        height: 800,
        correctOrientation: true,
        saveToGallery: false
      });
      
      return image;
    } catch (error: any) {
      // Si el usuario cancela, no mostrar error
      if (error?.message?.includes('cancelled') || error?.message?.includes('canceled') || error?.message?.includes('User cancelled')) {
        return null;
      }
      
      // Para otros errores, lanzar para que se muestren
      throw error;
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
