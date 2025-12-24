import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { AppointmentService } from '../../../services/appointment.service';
import { Appointment } from '../../../models/appointment.model';

interface RequestView {
  id: string;
  name: string;
  initials: string;
  type: string;
  time: string;
  date: string;
  startTime: string;
}

@Component({
  selector: 'app-doctor-home',
  templateUrl: './doctor-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class DoctorHomeComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);

  // Current user
  currentUser = this.authService.currentUser;

  // Agenda stats - Basadas en citas reales de hoy
  private todayAppointments = signal<Appointment[]>([]);
  pendingAppointments = computed(() => 
    this.todayAppointments().filter(apt => apt.status === 'pending' || apt.status === 'confirmed').length
  );
  completedAppointments = computed(() => 
    this.todayAppointments().filter(apt => apt.status === 'completed').length
  );
  totalAppointments = computed(() => this.todayAppointments().length);

  progressPercentage = computed(() => {
    const total = this.totalAppointments();
    const completed = this.completedAppointments();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  // Next appointment - Computed para obtener la próxima cita de hoy
  nextAppointment = computed(() => {
    const now = new Date();
    const upcoming = this.todayAppointments()
      .filter(apt => {
        if (apt.status !== 'pending' && apt.status !== 'confirmed') return false;
        const aptTime = this.parseAppointmentDateTime(apt.date, apt.startTime);
        return aptTime > now;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return upcoming.length > 0 ? upcoming[0] : null;
  });

  // Computed para obtener minutos hasta la próxima cita
  minutesUntilNext = computed(() => {
    const next = this.nextAppointment();
    if (!next) return 0;
    
    const now = new Date();
    const aptTime = this.parseAppointmentDateTime(next.date, next.startTime);
    const diffMs = aptTime.getTime() - now.getTime();
    return Math.max(0, Math.round(diffMs / 60000));
  });

  // Requests
  pendingRequests = computed(() => this.requests().length);
  requests = signal<RequestView[]>([]);
  private allPendingAppointments = signal<Appointment[]>([]);

  ngOnInit(): void {
    this.loadTodayAppointments();
    this.loadPendingAppointments();
  }

  private loadTodayAppointments(): void {
    const currentUser = this.authService.currentUser();
    const doctorId = currentUser?.uid;
    
    console.log('Usuario actual:', currentUser);
    console.log('Doctor ID:', doctorId);
    
    if (!doctorId) {
      console.log('No hay usuario logueado');
      return;
    }

    const today = new Date();
    const todayStr = this.formatDateToString(today);
    const now = new Date();

    this.appointmentService.getDoctorAppointments(doctorId).subscribe({
      next: (appointments) => {
        // Filtrar solo citas de hoy
        const todayApts = appointments.filter(apt => apt.date === todayStr);
        
        console.log('Citas de hoy:', todayApts);

        // Verificar y actualizar citas cuya hora ya pasó
        todayApts.forEach(apt => {
          if (apt.status === 'pending' || apt.status === 'confirmed') {
            const aptTime = this.parseAppointmentDateTime(apt.date, apt.endTime || apt.startTime);
            
            // Si ya pasó la hora de fin (o inicio), marcar como completada
            if (aptTime < now) {
              console.log(`Marcando cita ${apt.id} como completada (hora pasada)`);
              this.appointmentService.completeAppointment(apt.id).subscribe({
                next: () => {
                  apt.status = 'completed';
                  this.todayAppointments.set([...todayApts]);
                },
                error: (err) => console.error('Error al completar cita:', err)
              });
            }
          }
        });

        this.todayAppointments.set(todayApts);
      },
      error: (error) => {
        console.error('Error al cargar citas de hoy:', error);
      }
    });
  }

  private formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseAppointmentDateTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    return appointmentDate;
  }

  private loadPendingAppointments(): void {
    const currentUser = this.authService.currentUser();
    const doctorId = currentUser?.uid;
    
    console.log('Usuario actual:', currentUser);
    console.log('Doctor ID para citas pendientes:', doctorId);
    
    if (!doctorId) {
      console.log('No hay usuario logueado');
      return;
    }

    console.log('Cargando citas para doctor ID:', doctorId);
    
    this.appointmentService.getDoctorAppointments(doctorId).subscribe({
      next: (appointments) => {
        console.log('Citas obtenidas:', appointments);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filtrar citas pendientes desde hoy en adelante
        const pending = appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          const isPending = apt.status === 'pending';
          const isFutureOrToday = aptDate >= today;
          
          console.log(`Cita ${apt.id}:`, {
            date: apt.date,
            status: apt.status,
            isPending,
            isFutureOrToday,
            aptDate: aptDate.toISOString(),
            today: today.toISOString()
          });
          
          return isPending && isFutureOrToday;
        });
        
        console.log('Citas pendientes filtradas:', pending);
        
        this.allPendingAppointments.set(pending);
        
        // Mostrar solo las primeras 2-3 solicitudes en el dashboard
        const requestsView: RequestView[] = pending.slice(0, 3).map(apt => ({
          id: apt.id,
          name: apt.clientName,
          initials: this.getInitials(apt.clientName),
          type: this.getAppointmentTypeLabel(apt.type),
          time: this.formatAppointmentTime(apt.date, apt.startTime),
          date: apt.date,
          startTime: apt.startTime
        }));
        
        console.log('Vista de solicitudes:', requestsView);
        this.requests.set(requestsView);
      },
      error: (error) => {
        console.error('Error al cargar citas pendientes:', error);
        this.toastService.error('Error al cargar las solicitudes');
      }
    });
  }

  private getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private getAppointmentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'video': 'Videollamada',
      'audio': 'Llamada de audio',
      'chat': 'Consulta por chat'
    };
    return labels[type] || 'Consulta';
  }

  private formatAppointmentTime(date: string, startTime: string): string {
    const aptDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const aptDateOnly = new Date(aptDate);
    aptDateOnly.setHours(0, 0, 0, 0);
    
    let dateStr = '';
    if (aptDateOnly.getTime() === today.getTime()) {
      dateStr = 'Hoy';
    } else if (aptDateOnly.getTime() === tomorrow.getTime()) {
      dateStr = 'Mañana';
    } else {
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      dateStr = `${dayNames[aptDate.getDay()]} ${aptDate.getDate()} ${monthNames[aptDate.getMonth()]}`;
    }
    
    return `${dateStr}, ${startTime}`;
  }

  acceptRequest(requestId: string): void {
    this.appointmentService.confirmAppointment(requestId).subscribe({
      next: (success) => {
        if (success) {
          this.toastService.success('Solicitud aceptada correctamente');
          // Recargar las citas para actualizar la lista
          this.loadTodayAppointments();
          this.loadPendingAppointments();
        } else {
          this.toastService.error('No se pudo aceptar la solicitud');
        }
      },
      error: () => {
        this.toastService.error('Error al aceptar la solicitud');
      }
    });
  }

  rejectRequest(requestId: string): void {
    this.appointmentService.cancelAppointment(requestId).subscribe({
      next: (success) => {
        if (success) {
          this.toastService.info('Solicitud rechazada');
          // Recargar las citas para actualizar la lista
          this.loadTodayAppointments();
          this.loadPendingAppointments();
        } else {
          this.toastService.error('No se pudo rechazar la solicitud');
        }
      },
      error: () => {
        this.toastService.error('Error al rechazar la solicitud');
      }
    });
  }

  viewAllRequests(): void {
    this.router.navigate(['/calendar']);
  }

  startVideoCall(appointmentId: string): void {
    this.router.navigate(['/app/video-call', appointmentId]);
  }
}
