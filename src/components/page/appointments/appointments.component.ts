import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { Appointment } from '../../../models/appointment.model';
import { AppUser } from '../../../models/user.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  appointments = signal<Appointment[]>([]);
  upcomingAppointments = signal<Appointment[]>([]);
  pastAppointments = signal<Appointment[]>([]);
  isLoading = signal<boolean>(true);
  selectedTab = signal<'upcoming' | 'past'>('upcoming');

  ngOnInit(): void {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    this.appointmentService.getClientAppointments(userId).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.categorizeAppointments(appointments);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.isLoading.set(false);
      }
    });
  }

  private categorizeAppointments(appointments: Appointment[]): void {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    appointments.forEach(appointment => {
      // Si está completada o cancelada, va a pasadas
      if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        past.push(appointment);
      }
      // Si es futura, va a próximas
      else if (appointment.date > today || 
          (appointment.date === today && appointment.startTime >= currentTime)) {
        upcoming.push(appointment);
      } 
      // Si ya pasó la fecha/hora, va a pasadas
      else {
        past.push(appointment);
      }
    });

    // Ordenar próximas citas: más próxima primero (ascendente)
    upcoming.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    });

    // Ordenar citas pasadas: más reciente primero (descendente)
    past.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.startTime.localeCompare(a.startTime);
    });

    this.upcomingAppointments.set(upcoming);
    this.pastAppointments.set(past);
  }

  selectTab(tab: 'upcoming' | 'past'): void {
    this.selectedTab.set(tab);
  }

  joinVideoCall(appointmentId: string): void {
    this.router.navigate(['/app/video-call', appointmentId]);
  }

  cancelAppointment(appointmentId: string): void {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      this.appointmentService.cancelAppointment(appointmentId).subscribe({
        next: (success) => {
          if (success) {
            this.loadAppointments();
          }
        },
        error: (error) => {
          console.error('Error al cancelar cita:', error);
        }
      });
    }
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'pendiente',
      'scheduled': 'Programada',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'in-progress': 'En curso'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'status-pending',
      'scheduled': 'status-scheduled',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'in-progress': 'status-in-progress'
    };
    return classes[status] || '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatTime(time: string): string {
    return time;
  }

  canJoinCall(appointment: Appointment): boolean {
    // No puede unirse si está cancelada o completada
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return false;
    }

    // Para tipo video, permitir unirse
    if (appointment.type === 'video') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Si la cita está confirmada, permitir unirse en cualquier momento del día de la cita
      if (appointment.status === 'confirmed' && appointment.date === today) {
        return true;
      }

      // Para otros estados, verificar ventana de tiempo
      if (appointment.date === today) {
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
        const endDateTime = new Date(`${appointment.date}T${appointment.endTime}`);
        const nowDateTime = new Date();
        
        // Permitir unirse 15 minutos antes
        const fifteenMinutesBefore = new Date(appointmentDateTime.getTime() - 15 * 60000);
        
        return nowDateTime >= fifteenMinutesBefore && nowDateTime <= endDateTime;
      }
    }

    return false;
  }

  canCancelAppointment(appointment: Appointment): boolean {
    // Solo se puede cancelar si está confirmed
    return appointment.status === 'confirmed';
  }
}
