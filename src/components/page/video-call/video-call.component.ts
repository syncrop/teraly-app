import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
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

  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  appointment = signal<Appointment | null>(null);
  appointmentId = signal<string>('');
  isLoading = signal<boolean>(true);
  isMicOn = signal<boolean>(true);
  isVideoOn = signal<boolean>(true);
  isScreenSharing = signal<boolean>(false);
  callDuration = signal<string>('00:00');
  
  private callStartTime: Date | null = null;
  private durationInterval: any;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

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

  private async startCall(): Promise<void> {
    this.callStartTime = new Date();
    this.updateCallDuration();
    this.durationInterval = setInterval(() => {
      this.updateCallDuration();
    }, 1000);

    // Inicializar cámara y micrófono
    await this.initializeMedia();
  }

  private async initializeMedia(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      this.localStream = stream;
      
      // Esperar a que el ViewChild esté disponible
      setTimeout(() => {
        if (this.localVideoRef?.nativeElement) {
          this.localVideoRef.nativeElement.srcObject = stream;
          this.localVideoRef.nativeElement.muted = true; // Asegurar que está silenciado
          this.localVideoRef.nativeElement.volume = 0; // Volumen a 0
        }
      }, 100);
      
    } catch (error) {
      console.error('Error al acceder a la cámara/micrófono:', error);
      this.isVideoOn.set(false);
      this.isMicOn.set(false);
    }
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
    const newState = !this.isMicOn();
    this.isMicOn.set(newState);
    
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  }

  toggleVideo(): void {
    const newState = !this.isVideoOn();
    this.isVideoOn.set(newState);
    
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
    }
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

    // Detener todos los streams de medios
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    // Redirigir al usuario después de un pequeño delay
    setTimeout(() => {
      const currentUser = this.authService.currentUser();
      if (currentUser?.role === 'doctor') {
        this.router.navigate(['/app/home-doctor']);
      } else {
        this.router.navigate(['/app/appointments']);
      }
    }, 100);
  }
}
