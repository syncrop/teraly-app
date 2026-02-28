export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
export type AppointmentType = 'video' | 'audio' | 'chat';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName?: string;
  doctorPhotoUrl?: string;
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: number;
  status: AppointmentStatus;
  type: AppointmentType;
  reason?: string;
  notes?: string;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateAppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAppointmentInput = Partial<Omit<Appointment, 'id' | 'doctorId' | 'clientId' | 'createdAt'>>;
