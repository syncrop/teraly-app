import { Appointment } from './appointment.model';

export interface Patient {
  uid: string;
  email: string;
  fullName: string;
  photoURL?: string;
  phone?: string;
  lastAppointment?: {
    date: string;
    time: string;
    reason: string;
  };
  nextAppointment?: {
    date: string;
    time: string;
    reason: string;
  };
  totalSessions: number;
  status: 'active' | 'pending' | 'archived';
  notes?: string;
  createdAt: Date;
}

export interface PatientWithAppointments extends Patient {
  appointments: Appointment[];
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
}

export type PatientFilter = 'active' | 'pending' | 'archived';
