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
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private firestore = inject(Firestore);
  private appointmentsCollection = collection(this.firestore, 'appointments');

  /**
   * Obtener todas las citas de un doctor
   */
  getDoctorAppointments(doctorId: string): Observable<Appointment[]> {
    const q = query(
      this.appointmentsCollection,
      where('doctorId', '==', doctorId),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as Appointment;
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
    // Consulta simplificada sin índice compuesto
    const q = query(
      this.appointmentsCollection,
      where('doctorId', '==', doctorId)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const appointments = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as Appointment;
        });
        
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
   * Obtener citas de un cliente
   */
  getClientAppointments(clientId: string): Observable<Appointment[]> {
    const q = query(
      this.appointmentsCollection,
      where('clientId', '==', clientId),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as Appointment;
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
    const appointmentRef = doc(this.firestore, 'appointments', appointmentId);
    
    return from(getDoc(appointmentRef)).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as Appointment;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error al obtener cita:', error);
        return of(null);
      })
    );
  }

  /**
   * Crear una nueva cita
   */
  createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Observable<string | null> {
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
    const appointmentRef = doc(this.firestore, 'appointments', appointmentId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    return from(updateDoc(appointmentRef, updateData)).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error al actualizar cita:', error);
        return of(false);
      })
    );
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
    const appointmentRef = doc(this.firestore, 'appointments', appointmentId);
    
    return from(deleteDoc(appointmentRef)).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error al eliminar cita:', error);
        return of(false);
      })
    );
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
    const q = query(
      this.appointmentsCollection,
      where('doctorId', '==', doctorId),
      where('date', '==', date),
      where('status', 'in', ['pending', 'confirmed'])
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const appointments = snapshot.docs.map(doc => doc.data() as Appointment);
        
        // Verificar si hay conflicto con alguna cita existente
        const hasConflict = appointments.some(apt => {
          // Excluir la cita actual si se está editando
          if (excludeAppointmentId && apt.id === excludeAppointmentId) {
            return false;
          }

          // Verificar solapamiento de horarios
          const aptStart = this.timeToMinutes(apt.startTime);
          const aptEnd = this.timeToMinutes(apt.endTime);
          const newStart = this.timeToMinutes(startTime);
          const newEnd = this.timeToMinutes(endTime);

          return (
            (newStart >= aptStart && newStart < aptEnd) ||
            (newEnd > aptStart && newEnd <= aptEnd) ||
            (newStart <= aptStart && newEnd >= aptEnd)
          );
        });

        return !hasConflict;
      }),
      catchError(error => {
        console.error('Error al verificar disponibilidad:', error);
        return of(false);
      })
    );
  }

  /**
   * Convertir tiempo HH:MM a minutos desde medianoche
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
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
