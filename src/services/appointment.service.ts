import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs
} from '@angular/fire/firestore';
import { Appointment } from '../models/appointment.model';

/**
 * Service to manage appointments between patients and specialists
 */
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private firestore = inject(Firestore);

  /**
   * Creates a new appointment
   */
  async createAppointment(appointment: Omit<Appointment, 'id' | 'status'>) {
    const appointmentsRef = collection(this.firestore, 'appointments');
    return addDoc(appointmentsRef, {
      ...appointment,
      status: 'pending',
      createdAt: new Date()
    });
  }

  /**
   * Gets appointments for a user (either patient or specialist)
   */
  async getUserAppointments(uid: string, role: 'patient' | 'specialist') {
    const appointmentsRef = collection(this.firestore, 'appointments');
    const fieldToSearch = role === 'patient' ? 'patientId' : 'specialistId';
    
    const q = query(appointmentsRef, where(fieldToSearch, '==', uid));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Appointment));
  }
}
