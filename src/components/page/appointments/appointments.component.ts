import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { ReviewService } from '../../../services/review.service';
import { ToastService } from '../../../services/toast.service';
import { Appointment } from '../../../models/appointment.model';
import { AppUser } from '../../../models/user.model';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private reviewService = inject(ReviewService);
  private toastService = inject(ToastService);

  appointments = signal<Appointment[]>([]);
  upcomingAppointments = signal<Appointment[]>([]);
  pastAppointments = signal<Appointment[]>([]);
  isLoading = signal<boolean>(true);
  selectedTab = signal<'upcoming' | 'past'>('upcoming');

  // Reviews
  isLoadingReviewInfo = signal<boolean>(true);
  /** doctorId -> true */
  reviewedDoctorMap = signal<Record<string, boolean>>({});

  // Review modal state
  isReviewModalOpen = signal<boolean>(false);
  selectedAppointmentForReview = signal<Appointment | null>(null);
  reviewRating = signal<number>(5);
  reviewComment = signal<string>('');
  isSubmittingReview = signal<boolean>(false);

  readonly statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    scheduled: 'Programada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    'in-progress': 'En curso',
    confirmed: 'Confirmada'
  };

  readonly statusClasses: Record<string, string> = {
    pending: 'status-pending',
    scheduled: 'status-scheduled',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    'in-progress': 'status-in-progress',
    confirmed: 'status-confirmed'
  };

  ngOnInit(): void {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    this.loadReviewedDoctors(userId);

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

  private loadReviewedDoctors(userId: string): void {
    this.isLoadingReviewInfo.set(true);
    this.reviewService.getClientReviews(userId).subscribe({
      next: (reviews) => {
        const map: Record<string, boolean> = {};
        for (const r of reviews ?? []) {
          if (r?.doctorId) map[r.doctorId] = true;
        }
        this.reviewedDoctorMap.set(map);
        this.isLoadingReviewInfo.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reseñas del usuario:', err);
        this.reviewedDoctorMap.set({});
        this.isLoadingReviewInfo.set(false);
      },
    });
  }

  canLeaveReview(appointment: Appointment): boolean {
    if (this.isLoadingReviewInfo()) return false;
    if (!appointment?.id) return false;
    if (appointment.status !== 'completed') return false;

    const doctorId = appointment.doctorId;
    if (!doctorId) return false;

    return !this.reviewedDoctorMap()[doctorId];
  }

  hasReviewForDoctor(doctorId: string | null | undefined): boolean {
    if (!doctorId) return false;
    return !!this.reviewedDoctorMap()[doctorId];
  }

  openReviewModal(appointment: Appointment): void {
    if (!appointment?.id) return;
    if (appointment.status !== 'completed') {
      this.toastService.error('Solo puedes reseñar una cita completada');
      return;
    }
    if (!this.canLeaveReview(appointment)) {
      this.toastService.info('Ya has dejado una reseña a este profesional');
      return;
    }

    this.selectedAppointmentForReview.set(appointment);
    this.reviewRating.set(5);
    this.reviewComment.set('');
    this.isReviewModalOpen.set(true);
  }

  closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
    this.selectedAppointmentForReview.set(null);
    this.reviewRating.set(5);
    this.reviewComment.set('');
    this.isSubmittingReview.set(false);
  }

  setReviewRating(rating: number): void {
    this.reviewRating.set(rating);
  }

  onReviewCommentInput(value: string): void {
    this.reviewComment.set(value);
  }

  submitReview(): void {
    const appointment = this.selectedAppointmentForReview();
    const userId = this.authService.getCurrentUserId();
    const user = this.authService.currentUser();

    if (!appointment?.id || !appointment.doctorId) {
      this.toastService.error('No se pudo preparar la reseña');
      return;
    }
    if (!userId || !user || user.role !== 'client') {
      this.toastService.error('Debes iniciar sesión como paciente para dejar una reseña');
      return;
    }
    if (appointment.status !== 'completed') {
      this.toastService.error('Solo puedes reseñar una cita completada');
      return;
    }
    if (this.hasReviewForDoctor(appointment.doctorId)) {
      this.toastService.info('Ya has dejado una reseña a este profesional');
      return;
    }

    const rating = this.reviewRating();
    const comment = this.reviewComment().trim();
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      this.toastService.error('Selecciona una calificación válida (1-5)');
      return;
    }
    if (!comment) {
      this.toastService.error('Escribe un comentario');
      return;
    }

    this.isSubmittingReview.set(true);
    this.reviewService
      .createReview({
        doctorId: appointment.doctorId,
        clientId: userId,
        appointmentId: appointment.id,
        rating,
        comment,
        clientName: user.fullName || user.email || 'Usuario',
        clientAvatar: user.photoURL ?? null,
      })
      .subscribe({
        next: (ok) => {
          this.isSubmittingReview.set(false);
          if (ok) {
            // Mark as reviewed to hide further buttons for this doctor.
            this.reviewedDoctorMap.update((prev) => ({
              ...prev,
              [appointment.doctorId]: true,
            }));
            this.toastService.success('¡Reseña enviada!');
            this.closeReviewModal();
          } else {
            this.toastService.error('No se pudo enviar la reseña');
          }
        },
        error: (err) => {
          console.error('Error al enviar reseña:', err);
          this.isSubmittingReview.set(false);
          this.toastService.error('Error al enviar la reseña');
        },
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
    return appointment.type === 'video' && appointment.status === 'confirmed';
  }

  canCancelAppointment(appointment: Appointment): boolean {
    // Solo se puede cancelar si está confirmed
    return appointment.status === 'confirmed';
  }

  trackByAppointment = (_: number, appointment: Appointment): string => {
    return appointment.id ?? `${appointment.date}-${appointment.startTime}-${appointment.doctorId ?? ''}`;
  };
}
