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
  duration: number; // minutos
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  type: 'video' | 'audio' | 'chat';
  reason?: string; // Motivo de la consulta
  notes?: string; // Notas del doctor
  price: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  dayName: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  appointments: Appointment[];
  hasAppointments: boolean;
  isAvailable: boolean; // Si el doctor tiene disponibilidad ese día
}

export interface MonthView {
  year: number;
  month: number; // 0-11
  monthName: string;
  weeks: CalendarDay[][];
}

export interface AppointmentSlot {
  time: string;
  appointment?: Appointment;
  isAvailable: boolean;
}
