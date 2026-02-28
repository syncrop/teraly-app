import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.model';
import { ApiClientService } from './api-client.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentsApiService {
  private readonly api = inject(ApiClientService);

  listDoctorAppointments(doctorId: string, startDate?: string, endDate?: string): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('/v1/appointments', {
      doctorId,
      startDate,
      endDate,
    });
  }

  listClientAppointments(clientId: string): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('/v1/appointments', {
      clientId,
    });
  }

  getAppointmentById(appointmentId: string): Observable<Appointment | null> {
    return this.api.get<Appointment | null>(`/v1/appointments/${encodeURIComponent(appointmentId)}`);
  }

  createAppointment(payload: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Observable<{ id: string } | null> {
    return this.api.post<{ id: string } | null>('/v1/appointments', payload);
  }

  updateAppointment(appointmentId: string, updates: Partial<Appointment>): Observable<{ success: boolean }>{
    return this.api.patch<{ success: boolean }>(`/v1/appointments/${encodeURIComponent(appointmentId)}`, updates);
  }

  deleteAppointment(appointmentId: string): Observable<{ success: boolean }>{
    return this.api.delete<{ success: boolean }>(`/v1/appointments/${encodeURIComponent(appointmentId)}`);
  }

  isTimeSlotAvailable(params: {
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeAppointmentId?: string;
  }): Observable<{ available: boolean }>{
    return this.api.get<{ available: boolean }>('/v1/appointments/availability', params);
  }
}
