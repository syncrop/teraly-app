import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Servicio para acceder a Firestore en plataformas nativas usando la REST API
 * Esto soluciona los problemas de timeout del SDK de JavaScript en iOS
 */
@Injectable({
  providedIn: 'root'
})
export class FirestoreNativeService {
  private http = inject(HttpClient);
  private readonly PROJECT_ID = 'teraly-ba';
  private readonly FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${this.PROJECT_ID}/databases/(default)/documents`;

  /**
   * Obtener el token de autenticación actual
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.getIdToken();
        return result.token || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Convertir documento de Firestore REST API a objeto JavaScript
   */
  private convertFirestoreDocument(doc: any): any {
    if (!doc || !doc.fields) return null;

    const result: any = {};
    const fields = doc.fields;

    for (const [key, value] of Object.entries(fields)) {
      const field = value as any;
      
      if (field.stringValue !== undefined) {
        result[key] = field.stringValue;
      } else if (field.integerValue !== undefined) {
        result[key] = parseInt(field.integerValue);
      } else if (field.doubleValue !== undefined) {
        result[key] = field.doubleValue;
      } else if (field.booleanValue !== undefined) {
        result[key] = field.booleanValue;
      } else if (field.timestampValue !== undefined) {
        result[key] = new Date(field.timestampValue);
      } else if (field.arrayValue && field.arrayValue.values) {
        result[key] = field.arrayValue.values.map((v: any) => {
          if (v.stringValue !== undefined) return v.stringValue;
          if (v.integerValue !== undefined) return parseInt(v.integerValue);
          if (v.doubleValue !== undefined) return v.doubleValue;
          if (v.booleanValue !== undefined) return v.booleanValue;
          return v;
        });
      } else if (field.mapValue && field.mapValue.fields) {
        result[key] = this.convertFirestoreDocument({ fields: field.mapValue.fields });
      } else if (field.nullValue !== undefined) {
        result[key] = null;
      }
    }

    return result;
  }

  /**
   * Obtener un documento por ID usando la REST API
   */
  async getDocument<T>(collection: string, documentId: string): Promise<T | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return null;
      }

      const url = `${this.FIRESTORE_API}/${collection}/${documentId}`;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await firstValueFrom(
        this.http.get(url, { headers })
      );
      
      const convertedData = this.convertFirestoreDocument(response);
      
      if (convertedData) {
        const result = { id: documentId, ...convertedData } as T;
        return result;
      }

      return null;
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      
      throw error;
    }
  }
}
