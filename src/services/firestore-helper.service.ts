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

@Injectable({
  providedIn: 'root'
})
export class FirestoreHelperService {
  private firestore = inject(Firestore);

  /**
   * Obtener un documento de Firestore por su ID
   */
  async getDocument<T>(collectionName: string, documentId: string): Promise<T | null> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      
      return null;
    } catch (error) {
      console.error(`Error al obtener documento de ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Obtener múltiples documentos con query constraints
   */
  async getDocuments<T>(
    collectionName: string, 
    ...queryConstraints: QueryConstraint[]
  ): Promise<T[]> {
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
      console.error(`Error al obtener documentos de ${collectionName}:`, error);
      throw error;
    }
  }
}
