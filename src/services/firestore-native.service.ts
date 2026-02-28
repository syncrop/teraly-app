 
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
          if (v.mapValue && v.mapValue.fields) {
            return this.convertFirestoreDocument({ fields: v.mapValue.fields });
          }
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
   * Eliminar un documento usando la REST API
   */
  async deleteDocument(collection: string, documentId: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;
      const url = `${this.FIRESTORE_API}/${collection}/${documentId}`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      await firstValueFrom(this.http.delete(url, { headers }));
      return true;
    } catch (error) {
      return false;
    }
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

    /**
   * Actualizar campos de un documento usando la REST API
   */
  async updateDocument(collection: string, documentId: string, data: any): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      const url = `${this.FIRESTORE_API}/${collection}/${documentId}?updateMask.fieldPaths=${Object.keys(data).join(',')}`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      // Convertir los datos a formato Firestore
      const fields: any = {};
      for (const key of Object.keys(data)) {
        fields[key] = this.convertValueToFirestore(data[key]);
      }
      const body = { fields };

      await firstValueFrom(this.http.patch(url, body, { headers }));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Crear o reemplazar un documento (upsert) usando la REST API.
   * Útil para guardar docs con IDs determinísticos (ej: reviews).
   */
  async setDocument(collection: string, documentId: string, data: any): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      const url = `${this.FIRESTORE_API}/${collection}/${documentId}`;
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const fields: any = {};
      for (const key of Object.keys(data ?? {})) {
        fields[key] = this.convertValueToFirestore(data[key]);
      }

      const body = { fields };
      await firstValueFrom(this.http.patch(url, body, { headers }));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener múltiples documentos de una colección con query
   */
  async getDocuments<T>(collection: string, whereField?: string, whereOp?: string, whereValue?: any): Promise<T[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return [];
      }

      let url = `${this.FIRESTORE_API}/${collection}`;
      
      // Si hay filtro WHERE, construir la query estructurada
      if (whereField && whereOp && whereValue !== undefined) {
        const structuredQuery = {
          structuredQuery: {
            from: [{ collectionId: collection }],
            where: {
              fieldFilter: {
                field: { fieldPath: whereField },
                op: this.convertOperator(whereOp),
                value: this.convertValueToFirestore(whereValue)
              }
            }
          }
        };

        const projectUrl = `https://firestore.googleapis.com/v1/projects/${this.PROJECT_ID}/databases/(default)/documents:runQuery`;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const response = await firstValueFrom(
          this.http.post<any[]>(projectUrl, structuredQuery, { headers })
        );

        const documents: T[] = [];
        if (response && Array.isArray(response)) {
          for (const item of response) {
            if (item.document) {
              const convertedData = this.convertFirestoreDocument(item.document);
              if (convertedData) {
                const pathParts = item.document.name.split('/');
                const id = pathParts[pathParts.length - 1];
                documents.push({ id, ...convertedData } as T);
              }
            }
          }
        }

        return documents;
      }

      // Sin filtros, obtener todos los documentos
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await firstValueFrom(
        this.http.get<any>(url, { headers })
      );

      const documents: T[] = [];
      if (response && response.documents) {
        for (const doc of response.documents) {
          const convertedData = this.convertFirestoreDocument(doc);
          if (convertedData) {
            const pathParts = doc.name.split('/');
            const id = pathParts[pathParts.length - 1];
            documents.push({ id, ...convertedData } as T);
          }
        }
      }

      return documents;
    } catch (error: any) {
      if (error?.status === 404) {
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Convertir operador de Firestore a formato REST API
   */
  private convertOperator(op: string): string {
    const operators: { [key: string]: string } = {
      '==': 'EQUAL',
      '!=': 'NOT_EQUAL',
      '<': 'LESS_THAN',
      '<=': 'LESS_THAN_OR_EQUAL',
      '>': 'GREATER_THAN',
      '>=': 'GREATER_THAN_OR_EQUAL',
      'array-contains': 'ARRAY_CONTAINS',
      'in': 'IN',
      'array-contains-any': 'ARRAY_CONTAINS_ANY',
      'not-in': 'NOT_IN'
    };
    return operators[op] || 'EQUAL';
  }

  /**
   * Convertir valor JavaScript a formato Firestore
   */
  private convertValueToFirestore(value: any): any {
    if (typeof value === 'string') {
      return { stringValue: value };
    } else if (typeof value === 'number') {
      return Number.isInteger(value) 
        ? { integerValue: value.toString() }
        : { doubleValue: value };
    } else if (typeof value === 'boolean') {
      return { booleanValue: value };
    } else if (value === null) {
      return { nullValue: null };
    } else if (value instanceof Date) {
      return { timestampValue: value.toISOString() };
    } else if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map(v => this.convertValueToFirestore(v))
        }
      };
    }
    return { stringValue: String(value) };
  }
}
