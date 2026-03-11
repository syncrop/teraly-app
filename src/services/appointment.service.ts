import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, of } from 'rxjs';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy
} from '@angular/fire/firestore';
import { Capacitor } from '@capacitor/core';
import { FirestoreNativeService } from './firestore-native.service';
import { Appointment } from '../models/appointment.model';
import { FirestoreHelperService } from './firestore-helper.service';
import { isBackendEnabled } from '../config/backend.config';
import { AppointmentsApiService } from './appointments-api.service';
import { AvailabilitySlotsService } from './availability-slots.service';
import { AppointmentInterval } from './availability-slots.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private firestore = inject(Firestore);
  private appointmentsCollection = collection(this.firestore, 'appointments');
  private firestoreHelper = inject(FirestoreHelperService);
  private firestoreNative = inject(FirestoreNativeService);
  private appointmentsApi = inject(AppointmentsApiService);
  private availabilitySlots = inject(AvailabilitySlotsService);

  /**
   * Obtener todas las citas de un doctor
   */
  getDoctorAppointments(doctorId: string): Observable<Appointment[]> {
    console.log('AppointmentService: Consultando citas para doctorId:', doctorId);

    if (isBackendEnabled()) {
      return this.appointmentsApi.listDoctorAppointments(doctorId).pipe(
        map((appointments) =>
          (appointments ?? []).sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
          })
        ),
        catchError((error) => {
          console.error('Error al obtener citas del doctor (backend):', error);
          return of([]);
        })
      );
    }
    
    return from(this.firestoreHelper.getDocuments<Appointment>('appointments', where('doctorId', '==', doctorId))).pipe(
      map(appointments => {
        console.log('AppointmentService: Documentos encontrados:', appointments.length);
        
        // Ordenar en memoria por fecha y hora
        return appointments.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
      }),
      catchError(error => {
        console.error('Error al obtener citas del doctor:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener citas de un doctor en un rango de fechas
   */
  getDoctorAppointmentsByDateRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Observable<Appointment[]> {
    if (isBackendEnabled()) {
        return this.appointmentsApi.listDoctorAppointments(doctorId, startDate, endDate).pipe(
        map((appointments) =>
          (appointments ?? []).sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
          })
        ),
        catchError((error) => {
          console.error('Error al obtener citas por rango (backend):', error);
          return of([]);
        })
      );
    }

    return from(this.firestoreHelper.getDocuments<Appointment>('appointments', where('doctorId', '==', doctorId))).pipe(
      map(appointments => {
        // Filtrar por rango de fechas en memoria
        const filtered = appointments.filter(apt => 
          apt.date >= startDate && apt.date <= endDate
        );
        
        // Ordenar por fecha y hora
        return filtered.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
      }),
      catchError(error => {
        console.error('Error al obtener citas por rango:', error);
        return of([]);
      })
    );
  }

  /**
   * Public busy slots for a doctor in a date range.
   * Only returns time intervals; safe to call from the public doctor profile.
   */
  getDoctorBusySlotsPublicByDateRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Observable<AppointmentInterval[]> {
    if (isBackendEnabled()) {
      return this.appointmentsApi.listDoctorBusySlotsPublic(doctorId, startDate, endDate).pipe(
        map((slots) =>
          (slots ?? []).map((s) => ({
            id: undefined,
            startTime: s.startTime,
            endTime: s.endTime,
            status: 'confirmed',
          }))
        ),
        catchError((error) => {
          console.error('Error al obtener busy slots (backend public):', error);
          return of([]);
        })
      );
    }

    // Fallback: use full appointments (may still be subject to Firestore rules).
    return this.getDoctorAppointmentsByDateRange(doctorId, startDate, endDate);
  }

  /**
   * Obtener citas de un cliente
   */
  getClientAppointments(clientId: string): Observable<Appointment[]> {
    if (isBackendEnabled()) {
        return this.appointmentsApi.listClientAppointments(clientId).pipe(
        map((appointments) =>
          (appointments ?? []).sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
          })
        ),
        catchError((error) => {
          console.error('Error al obtener citas del cliente (backend):', error);
          return of([]);
        })
      );
    }

    return from(this.firestoreHelper.getDocuments<Appointment>('appointments', where('clientId', '==', clientId))).pipe(
      map(appointments => {
        // Ordenar en memoria por fecha y hora
        return appointments.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
      }),
      catchError(error => {
        console.error('Error al obtener citas del cliente:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener una cita específica por ID
   */
  getAppointmentById(appointmentId: string): Observable<Appointment | null> {
    if (isBackendEnabled()) {
      return this.appointmentsApi.getAppointmentById(appointmentId);
    }

    return from(this.firestoreHelper.getDocument<Appointment>('appointments', appointmentId));
  }

  /**
   * Crear una nueva cita
   */
  createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Observable<string | null> {
    if (isBackendEnabled()) {
        return this.appointmentsApi.createAppointment(appointment).pipe(
        map((r) => r?.id ?? null),
        catchError((error) => {
          console.error('Error al crear cita (backend):', error);
          return of(null);
        })
      );
    }

    const now = Timestamp.now();
    const appointmentData = {
      ...appointment,
      createdAt: now,
      updatedAt: now
    };

    return from(addDoc(this.appointmentsCollection, appointmentData)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error al crear cita:', error);
        return of(null);
      })
    );
  }

  /**
   * Actualizar una cita existente
   */
  updateAppointment(appointmentId: string, updates: Partial<Appointment>): Observable<boolean> {
    if (isBackendEnabled()) {
        return this.appointmentsApi.updateAppointment(appointmentId, updates).pipe(
        map((r) => !!r?.success),
        catchError((error) => {
          console.error('Error al actualizar cita (backend):', error);
          return of(false);
        })
      );
    }

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    if (Capacitor.isNativePlatform()) {
      // Usar REST API en iOS/Android
      return from(this.firestoreNative.updateDocument('appointments', appointmentId, updateData)).pipe(
        map((result) => !!result),
        catchError((error) => {
          console.error('Error al actualizar cita (nativo):', error);
          return of(false);
        })
      );
    } else {
      // Usar SDK web en web
      const appointmentRef = doc(this.firestore, 'appointments', appointmentId);
      return from(updateDoc(appointmentRef, updateData)).pipe(
        map(() => true),
        catchError(error => {
          console.error('Error al actualizar cita:', error);
          return of(false);
        })
      );
    }
  }

  /**
   * Actualizar el estado de una cita
   */
  updateAppointmentStatus(
    appointmentId: string,
    status: Appointment['status']
  ): Observable<boolean> {
    return this.updateAppointment(appointmentId, { status });
  }

  /**
   * Agregar notas a una cita
   */
  updateAppointmentNotes(appointmentId: string, notes: string): Observable<boolean> {
    return this.updateAppointment(appointmentId, { notes });
  }

  /**
   * Cancelar una cita
   */
  cancelAppointment(appointmentId: string): Observable<boolean> {
    return this.updateAppointmentStatus(appointmentId, 'cancelled');
  }

  /**
   * Confirmar una cita
   */
  confirmAppointment(appointmentId: string): Observable<boolean> {
    return this.updateAppointmentStatus(appointmentId, 'confirmed');
  }

  /**
   * Completar una cita
   */
  completeAppointment(appointmentId: string): Observable<boolean> {
    return this.updateAppointmentStatus(appointmentId, 'completed');
  }

  /**
   * Eliminar una cita
   */
  deleteAppointment(appointmentId: string): Observable<boolean> {
    if (isBackendEnabled()) {
        return this.appointmentsApi.deleteAppointment(appointmentId).pipe(
        map((r) => !!r?.success),
        catchError((error) => {
          console.error('Error al eliminar cita (backend):', error);
          return of(false);
        })
      );
    }

    if (Capacitor.isNativePlatform()) {
      // Usar REST API en iOS/Android
      return from(this.firestoreNative.deleteDocument('appointments', appointmentId)).pipe(
        map((result) => !!result),
        catchError((error) => {
          console.error('Error al eliminar cita (nativo):', error);
          return of(false);
        })
      );
    } else {
      // Usar SDK web en web
      const appointmentRef = doc(this.firestore, 'appointments', appointmentId);
      return from(deleteDoc(appointmentRef)).pipe(
        map(() => true),
        catchError(error => {
          console.error('Error al eliminar cita:', error);
          return of(false);
        })
      );
    }
  }

  /**
   * Verificar si un horario está disponible
   */
  isTimeSlotAvailable(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Observable<boolean> {
    if (isBackendEnabled()) {
      // Public endpoint works for both clients and doctors.
      return this.appointmentsApi
        .isTimeSlotAvailablePublic({ doctorId, date, startTime, endTime })
        .pipe(
          map((r) => !!r?.available),
          catchError((error) => {
            console.error('Error al verificar disponibilidad (backend):', error);
            return of(false);
          })
        );
    }

    const q = query(
      this.appointmentsCollection,
      where('doctorId', '==', doctorId),
      where('date', '==', date),
      where('status', 'in', ['pending', 'confirmed'])
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const appointments = snapshot.docs.map(doc => {
          const data = doc.data();
          return { ...data, id: doc.id } as Appointment;
        });

        return this.availabilitySlots.isTimeSlotAvailableAgainstAppointments({
          startTime,
          endTime,
          appointments,
          excludeAppointmentId,
        });
      }),
      catchError(error => {
        console.error('Error al verificar disponibilidad:', error);
        return of(false);
      })
    );
  }

  /**
   * Obtener estadísticas de citas del doctor
   */
  getDoctorAppointmentStats(doctorId: string, month: number, year: number): Observable<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  }> {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

    return this.getDoctorAppointmentsByDateRange(doctorId, startDate, endDate).pipe(
      map(appointments => {
        return {
          total: appointments.length,
          pending: appointments.filter(a => a.status === 'pending').length,
          confirmed: appointments.filter(a => a.status === 'confirmed').length,
          completed: appointments.filter(a => a.status === 'completed').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length,
          noShow: appointments.filter(a => a.status === 'no-show').length
        };
      })
    );
  }
}
