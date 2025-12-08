/**
 * @deprecated This service has been refactored and split into smaller, more focused services.
 * 
 * Please use the following services instead:
 * - Authentication: Use AuthService (src/services/auth.service.ts)
 * - User profiles: Use UserService (src/services/user.service.ts)
 * - Appointments: Use AppointmentService (src/services/appointment.service.ts)
 * 
 * This file is kept for reference but should not be used in new code.
 * It will be removed in a future version once all dependencies are migrated.
 */

import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc,
  query, 
  where, 
  getDocs
} from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

// Note: These types are maintained in their respective model files:
// - AppUser is in auth.service.ts
// - Appointment is in models/appointment.model.ts

/**
 * @deprecated Use AppointmentService instead
 */
@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  /**
   * @deprecated Use AuthService.register() instead
   */
  async registerUser(email: string, pass: string, userData: any) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, pass);
    const uid = credential.user.uid;

    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, {
      uid: uid,
      ...userData,
      createdAt: new Date(),
      isVerified: userData.role === 'specialist' ? false : true
    });

    return uid;
  }

  /**
   * @deprecated Use UserService.getUserProfile() instead
   */
  async getUserProfile(uid: string): Promise<any> {
    const userDoc = await getDoc(doc(this.firestore, 'users', uid));
    return userDoc.data();
  }

  /**
   * @deprecated Use AppointmentService.createAppointment() instead
   */
  async createAppointment(appointment: any) {
    const appointmentsRef = collection(this.firestore, 'appointments');
    return addDoc(appointmentsRef, {
      ...appointment,
      status: 'pending',
      createdAt: new Date()
    });
  }

  /**
   * @deprecated Use AppointmentService.getUserAppointments() instead
   */
  async getMyAppointments(uid: string, role: 'patient' | 'specialist') {
    const appointmentsRef = collection(this.firestore, 'appointments');
    const fieldToSearch = role === 'patient' ? 'patientId' : 'specialistId';
    
    const q = query(appointmentsRef, where(fieldToSearch, '==', uid));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * @deprecated Use UserService.getVerifiedDoctors() instead
   */
  async getVerifiedSpecialists() {
    const usersRef = collection(this.firestore, 'users');
    const q = query(
      usersRef, 
      where('role', '==', 'specialist'), 
      where('isVerified', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }
}