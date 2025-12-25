import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, of, combineLatest } from 'rxjs';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { AppointmentService } from './appointment.service';
import { Patient, PatientWithAppointments } from '../models/patient.model';
import { AppUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private firestore = inject(Firestore);
  private appointmentService = inject(AppointmentService);
  private usersCollection = collection(this.firestore, 'users');

  /**
   * Obtener todos los pacientes de un doctor
   */
  getDoctorPatients(doctorId: string): Observable<Patient[]> {
    return this.appointmentService.getDoctorAppointments(doctorId).pipe(
      map(appointments => {
        // Obtener IDs únicos de clientes
        const clientIds = [...new Set(appointments.map(apt => apt.clientId))];
        
        // Agrupar citas por cliente
        const patientMap = new Map<string, Patient>();
        
        clientIds.forEach(clientId => {
          const clientAppointments = appointments.filter(apt => apt.clientId === clientId);
          const sortedAppointments = clientAppointments.sort((a, b) => 
            new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime()
          );
          
          const now = new Date();
          const upcoming = sortedAppointments.filter(apt => {
            const aptDate = new Date(apt.date + 'T' + apt.startTime);
            return aptDate >= now && apt.status !== 'cancelled';
          });
          
          const past = sortedAppointments.filter(apt => {
            const aptDate = new Date(apt.date + 'T' + apt.startTime);
            return aptDate < now || apt.status === 'completed';
          });
          
          const firstAppointment = clientAppointments[0];
          const lastPast = past[past.length - 1];
          const nextUpcoming = upcoming[0];
          
          // Determinar estado del paciente
          let status: 'active' | 'pending' | 'archived' = 'archived';
          if (upcoming.length > 0) {
            status = 'active';
          } else if (past.length === 0 && upcoming.length === 0) {
            status = 'pending';
          }
          
          const patient: Patient = {
            uid: clientId,
            email: firstAppointment.clientName, // Temporal, se actualiza después
            fullName: firstAppointment.clientName,
            photoURL: firstAppointment.clientPhoto,
            lastAppointment: lastPast ? {
              date: lastPast.date,
              time: lastPast.startTime,
              reason: lastPast.reason || ''
            } : undefined,
            nextAppointment: nextUpcoming ? {
              date: nextUpcoming.date,
              time: nextUpcoming.startTime,
              reason: nextUpcoming.reason || ''
            } : undefined,
            totalSessions: past.filter(apt => apt.status === 'completed').length,
            status,
            createdAt: firstAppointment.createdAt
          };
          
          patientMap.set(clientId, patient);
        });
        
        return Array.from(patientMap.values());
      }),
      catchError(error => {
        console.error('Error al obtener pacientes:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener un paciente específico con todas sus citas
   */
  getPatientWithAppointments(doctorId: string, patientId: string): Observable<PatientWithAppointments | null> {
    return combineLatest([
      this.getDoctorPatients(doctorId),
      this.appointmentService.getDoctorAppointments(doctorId)
    ]).pipe(
      map(([patients, appointments]) => {
        const patient = patients.find(p => p.uid === patientId);
        if (!patient) return null;
        
        const patientAppointments = appointments.filter(apt => apt.clientId === patientId);
        const sortedAppointments = patientAppointments.sort((a, b) => 
          new Date(b.date + 'T' + b.startTime).getTime() - new Date(a.date + 'T' + a.startTime).getTime()
        );
        
        const now = new Date();
        const upcoming = sortedAppointments.filter(apt => {
          const aptDate = new Date(apt.date + 'T' + apt.startTime);
          return aptDate >= now && apt.status !== 'cancelled';
        });
        
        const past = sortedAppointments.filter(apt => {
          const aptDate = new Date(apt.date + 'T' + apt.startTime);
          return aptDate < now || apt.status === 'completed';
        });
        
        return {
          ...patient,
          appointments: sortedAppointments,
          upcomingAppointments: upcoming,
          pastAppointments: past
        };
      }),
      catchError(error => {
        console.error('Error al obtener paciente con citas:', error);
        return of(null);
      })
    );
  }

  /**
   * Buscar pacientes por nombre o email
   */
  searchPatients(doctorId: string, searchTerm: string): Observable<Patient[]> {
    return this.getDoctorPatients(doctorId).pipe(
      map(patients => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return patients;
        
        return patients.filter(patient => 
          patient.fullName.toLowerCase().includes(term) ||
          patient.email.toLowerCase().includes(term)
        );
      })
    );
  }

  /**
   * Filtrar pacientes por estado
   */
  filterPatientsByStatus(patients: Patient[], status: 'active' | 'pending' | 'archived'): Patient[] {
    return patients.filter(patient => patient.status === status);
  }
}
