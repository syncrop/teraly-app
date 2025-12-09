import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

interface Patient {
  name: string;
  photo: string;
  initials: string;
}

interface Appointment {
  id: string;
  patient: Patient;
  sessionType: string;
  topic: string;
  minutesUntil: number;
  time: string;
}

interface Request {
  id: string;
  name: string;
  initials: string;
  type: string;
  time: string;
}

@Component({
  selector: 'app-doctor-home',
  templateUrl: './doctor-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class DoctorHomeComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Current user
  currentUser = this.authService.currentUser;

  // Agenda stats
  pendingAppointments = signal(5);
  completedAppointments = signal(2);
  totalAppointments = signal(7);

  progressPercentage = computed(() => {
    const total = this.totalAppointments();
    const completed = this.completedAppointments();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  // Next appointment
  nextAppointment = signal<Appointment | null>({
    id: '1',
    patient: {
      name: 'Marta Gomez',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      initials: 'MG'
    },
    sessionType: 'Sesión de seguimiento',
    topic: 'Ansiedad',
    minutesUntil: 15,
    time: '10:00'
  });

  // Requests
  pendingRequests = signal(2);
  requests = signal<Request[]>([
    {
      id: '1',
      name: 'Alejandro García',
      initials: 'AG',
      type: 'Primera consulta',
      time: 'Mañana, 10:00'
    },
    {
      id: '2',
      name: 'Laura Martínez',
      initials: 'LM',
      type: 'Sesión de seguimiento',
      time: 'Mañana, 11:30'
    }
  ]);

  acceptRequest(requestId: string): void {
    this.toastService.success('Solicitud aceptada correctamente');
    // Remove request from list
    this.requests.update(reqs => reqs.filter(r => r.id !== requestId));
    this.pendingRequests.update(count => Math.max(0, count - 1));
  }

  rejectRequest(requestId: string): void {
    this.toastService.info('Solicitud rechazada');
    // Remove request from list
    this.requests.update(reqs => reqs.filter(r => r.id !== requestId));
    this.pendingRequests.update(count => Math.max(0, count - 1));
  }
}
