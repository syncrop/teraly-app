import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { Appointment } from '../../../models/appointment.model';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);

  appointment = signal<Appointment | null>(null);
  appointmentId = signal<string>('');
  isLoading = signal<boolean>(true);
  isMicOn = signal<boolean>(true);
  isVideoOn = signal<boolean>(true);
  isScreenSharing = signal<boolean>(false);
  callDuration = signal<string>('00:00');
  
  private callStartTime: Date | null = null;
  private durationInterval: any;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.appointmentId.set(id);
      this.loadAppointment(id);
      this.startCall();
    } else {
      this.router.navigate(['/app/home-client']);
    }
  }

  ngOnDestroy(): void {
    this.endCall();
  }

  private loadAppointment(id: string): void {
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        if (appointment) {
          this.appointment.set(appointment);
          this.isLoading.set(false);
        } else {
          this.router.navigate(['/app/home-client']);
        }
      },
      error: (error) => {
        console.error('Error al cargar cita:', error);
        this.router.navigate(['/app/home-client']);
      }
    });
  }

  private startCall(): void {
    this.callStartTime = new Date();
    this.updateCallDuration();
    this.durationInterval = setInterval(() => {
      this.updateCallDuration();
    }, 1000);

    // Aquí se integraría con un servicio de videollamadas como WebRTC, Twilio, etc.
    console.log('Iniciando videollamada para cita:', this.appointmentId());
  }

  private updateCallDuration(): void {
    if (!this.callStartTime) return;

    const now = new Date();
    const diff = Math.floor((now.getTime() - this.callStartTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    
    this.callDuration.set(
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  }

  toggleMic(): void {
    this.isMicOn.set(!this.isMicOn());
    // Aquí se implementaría la lógica para activar/desactivar el micrófono
    console.log('Micrófono:', this.isMicOn() ? 'Activado' : 'Desactivado');
  }

  toggleVideo(): void {
    this.isVideoOn.set(!this.isVideoOn());
    // Aquí se implementaría la lógica para activar/desactivar la cámara
    console.log('Video:', this.isVideoOn() ? 'Activado' : 'Desactivado');
  }

  toggleScreenShare(): void {
    this.isScreenSharing.set(!this.isScreenSharing());
    // Aquí se implementaría la lógica para compartir pantalla
    console.log('Compartir pantalla:', this.isScreenSharing() ? 'Activado' : 'Desactivado');
  }

  endCall(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }

    // Actualizar el estado de la cita a completada
    const appointmentId = this.appointmentId();
    if (appointmentId) {
      this.appointmentService.updateAppointmentStatus(appointmentId, 'completed').subscribe({
        next: () => {
          console.log('Cita marcada como completada');
        },
        error: (error) => {
          console.error('Error al actualizar estado de cita:', error);
        }
      });
    }

    // Aquí se implementaría la lógica para terminar la videollamada
    console.log('Finalizando videollamada');
    
    // Redirigir al usuario
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'doctor') {
      this.router.navigate(['/app/home-doctor']);
    } else {
      this.router.navigate(['/app/appointments']);
    }
  }
}
