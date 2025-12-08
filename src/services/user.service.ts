import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection,
  doc, 
  getDoc,
  query, 
  where, 
  getDocs
} from '@angular/fire/firestore';
import { AppUser } from './auth.service';

/**
 * Service to manage user profiles and queries
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);

  /**
   * Gets a user profile by UID
   */
  async getUserProfile(uid: string): Promise<AppUser | undefined> {
    const userDoc = await getDoc(doc(this.firestore, 'users', uid));
    return userDoc.data() as AppUser;
  }

  /**
   * Gets all verified doctors/specialists
   */
  async getVerifiedDoctors(): Promise<AppUser[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(
      usersRef, 
      where('role', '==', 'doctor'), 
      where('isVerified', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AppUser);
  }
}
