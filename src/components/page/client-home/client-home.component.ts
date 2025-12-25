import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MoodsComponent } from '../../shared/moods/moods.component';
import { AuthService } from '../../../services/auth.service';
import { AppointmentService } from '../../../services/appointment.service';
import { Appointment } from '../../../models/appointment.model';
import { MinutesToTimePipe } from '../../shared/pipes/minutes-to-time.pipe';
import { HeaderComponent } from '../../shared/header-home/header.component';

@Component({
  selector: 'app-client-home',
  templateUrl: './client-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MoodsComponent, MinutesToTimePipe, HeaderComponent]
})
export class ClientHomeComponent implements OnInit {
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user?.fullName?.split(' ')[0] || 'Usuario';
  });

  appointments = signal<Appointment[]>([]);
  isLoading = signal(true);

  nextAppointment = computed(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const upcoming = this.appointments().filter(apt => {
      if (apt.status !== 'pending' && apt.status !== 'confirmed') return false;
      if (apt.date > today) return true;
      if (apt.date === today && apt.startTime >= currentTime) return true;
      return false;
    });

    upcoming.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    return upcoming.length > 0 ? upcoming[0] : null;
  });

  minutesUntilNext = computed(() => {
    const next = this.nextAppointment();
    if (!next) return 0;

    const now = new Date();
    const [year, month, day] = next.date.split('-').map(Number);
    const [hours, minutes] = next.startTime.split(':').map(Number);
    const aptTime = new Date(year, month - 1, day, hours, minutes);
    
    const diffMs = aptTime.getTime() - now.getTime();
    return Math.max(0, Math.round(diffMs / 60000));
  });

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
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.isLoading.set(false);
      }
    });
  }

  formatDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateObj.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    }

    return dateObj.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }

  joinVideoCall(): void {
    const next = this.nextAppointment();
    if (next?.id) {
      this.router.navigate(['/app/video-call', next.id]);
    }
  }
}
