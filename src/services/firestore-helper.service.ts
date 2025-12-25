import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  QueryConstraint,
  DocumentData 
} from '@angular/fire/firestore';
import { Capacitor } from '@capacitor/core';
import { FirestoreNativeService } from './firestore-native.service';

@Injectable({
  providedIn: 'root'
})
export class FirestoreHelperService {
  private firestore = inject(Firestore);
  private firestoreNative = inject(FirestoreNativeService);

  /**
   * Obtener un documento de Firestore por su ID
   */
  async getDocument<T>(collectionName: string, documentId: string): Promise<T | null> {
    // En plataformas nativas (iOS/Android), usar la REST API
    if (Capacitor.isNativePlatform()) {
      return this.firestoreNative.getDocument<T>(collectionName, documentId);
    }

    // En web, usar el SDK normal de Firebase
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as T;
        return data;
      }
      
      return null;
    } catch (error: any) {
      throw new Error(`Error al obtener documento de ${collectionName}: ${error?.message || 'Error desconocido'}`);
    }
  }

  /**
   * Obtener múltiples documentos con query constraints
   */
  async getDocuments<T>(
    collectionName: string, 
    ...queryConstraints: QueryConstraint[]
  ): Promise<T[]> {
    // En plataformas nativas, convertir QueryConstraint a formato simple
    if (Capacitor.isNativePlatform() && queryConstraints.length > 0) {
      // Extraer el primer where constraint (limitación actual)
      const whereConstraint = queryConstraints.find(c => (c as any).type === 'where');
      
      if (whereConstraint) {
        const constraint = whereConstraint as any;
        // Los QueryConstraint de @angular/fire tienen esta estructura interna
        const field = constraint._field?.segments?.[0];
        const op = constraint._op;
        const value = constraint._value;
        
        if (field && op) {
          return this.firestoreNative.getDocuments<T>(collectionName, field, op, value);
        }
      }
      
      // Si no hay where, obtener todos
      return this.firestoreNative.getDocuments<T>(collectionName);
    }

    // En web, usar SDK normal
    try {
      const collectionRef = collection(this.firestore, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const documents: T[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() } as T);
      });
      
      return documents;
    } catch (error) {
      throw error;
    }
  }
}
