/**
 * Represents an appointment between a patient and a specialist
 */
export interface Appointment {
  id?: string;
  patientId: string;
  specialistId: string;
  date: any;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}
