import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { Appointment } from '../../../models/appointment.model';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant, RemoteTrackPublication, DataPacket_Kind } from 'livekit-client';
import { StreamChatService } from '../../../services/stream-chat.service';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoCallComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private streamChat = inject(StreamChatService);

  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  appointment = signal<Appointment | null>(null);
  appointmentId = signal<string>('');
  isLoading = signal<boolean>(true);
  isMicOn = signal<boolean>(true);
  isVideoOn = signal<boolean>(true);
  isScreenSharing = signal<boolean>(false);
  callDuration = signal<string>('00:00');
  showChat = signal<boolean>(false);
  messages = this.streamChat.messages;
  currentMessage = signal<string>('');
  
  private callStartTime: Date | null = null;
  private durationInterval: any;
  private room: Room | null = null;

  ngOnInit(): void {
    // Cambiar el color de las safe areas para la videollamada
    this.setSafeAreaColors('#1a202c');
    
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
    // Restaurar el color de las safe areas al salir
    this.setSafeAreaColors('#ffffff');
  }

  private setSafeAreaColors(color: string): void {
    const html = document.documentElement;
    const main = document.documentElement.querySelector('main');
    html.style.backgroundColor = color;
    if (main) {
      main.style.backgroundColor = color;
    }
  }

  private loadAppointment(id: string): void {
    console.log('Cargando cita con ID:', id);
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        if (appointment) {
          this.appointment.set(appointment);
          this.isLoading.set(false);

          // Connect Stream Chat for persistent messaging per appointment.
          this.connectStreamChat(appointment).catch((err) => {
            console.warn('Stream Chat connect failed', err);
          });
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

  private async connectStreamChat(appointment: Appointment): Promise<void> {
    await this.streamChat.connectToAppointment(appointment);

    // Mark as read as soon as the video call starts (no need to open the chat panel).
    await this.streamChat.markRead();
  }

  private async startCall(): Promise<void> {
    this.callStartTime = new Date();
    this.updateCallDuration();
    this.durationInterval = setInterval(() => {
      this.updateCallDuration();
    }, 1000);

    // Conectar a LiveKit
    await this.connectToLiveKit();
  }

  private async connectToLiveKit(): Promise<void> {
    try {
      // Crear room de LiveKit
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720, frameRate: 30 }
        }
      });

      // Configurar event listeners
      this.setupRoomEvents();

      // TODO: Obtener token de LiveKit desde tu backend
      // Por ahora usaremos valores de ejemplo - DEBES reemplazar esto
      const token = await this.getLiveKitToken();
      const wsURL = 'wss://teraly-video-md5t0rj8.livekit.cloud'; // Reemplazar con tu URL de LiveKit

      // Conectar a la room
      await this.room.connect(wsURL, token);
      console.log('Conectado a LiveKit room');

      // Habilitar cámara y micrófono
      await this.room.localParticipant.enableCameraAndMicrophone();
      
      // Adjuntar video local
      this.attachLocalVideo();
      
    } catch (error) {
      console.error('Error al conectar a LiveKit:', error);
      this.isLoading.set(false);
    }
  }

  private setupRoomEvents(): void {
    if (!this.room) return;

    // Cuando un participante se conecta
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('Participante conectado:', participant.identity);
    });

    // Cuando se suscribe a un track remoto
    this.room.on(RoomEvent.TrackSubscribed, (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (track.kind === Track.Kind.Video) {
        this.attachRemoteVideo(track);
      }
    });

    // Cuando se desconecta un participante
    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('Participante desconectado:', participant.identity);
    });

    // Cuando se desconecta de la room
    this.room.on(RoomEvent.Disconnected, () => {
      console.log('Desconectado de la room');
      this.isLoading.set(false);
    });

    // LiveKit Data channel chat is disabled (we use Stream Chat for persistence).
  }

  private attachLocalVideo(): void {
    if (!this.room || !this.localVideoRef?.nativeElement) return;

    const videoTrack = this.room.localParticipant.videoTrackPublications.values().next().value;
    if (videoTrack?.track) {
      videoTrack.track.attach(this.localVideoRef.nativeElement);
    }
  }

  private attachRemoteVideo(track: RemoteTrack): void {
    if (!this.remoteVideoRef?.nativeElement) return;

    track.attach(this.remoteVideoRef.nativeElement);
    console.log('Video remoto adjuntado');
  }

  private async getLiveKitToken(): Promise<string> {
    const appointmentId = this.appointmentId();
    const userId = this.authService.getCurrentUserId() || 'anonymous';
    const userName = this.authService.currentUser()?.fullName || userId;
    
    try {
      const response = await fetch('https://teraly-video-server-production.up.railway.app/getToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: `appointment-${appointmentId}`,
          username: userName
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error al obtener token de LiveKit:', error);
      throw error;
    }
  }

  private async initializeMedia(): Promise<void> {
    // Este método ya no es necesario con LiveKit
    // LiveKit maneja la captura de medios automáticamente
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
    if (!this.room) return;
    
    const newState = !this.isMicOn();
    this.isMicOn.set(newState);
    
    this.room.localParticipant.setMicrophoneEnabled(newState);
  }

  toggleVideo(): void {
    if (!this.room) return;
    
    const newState = !this.isVideoOn();
    this.isVideoOn.set(newState);
    
    this.room.localParticipant.setCameraEnabled(newState);
  }

  async toggleScreenShare(): Promise<void> {
    if (!this.room) return;
    
    const newState = !this.isScreenSharing();
    this.isScreenSharing.set(newState);
    
    if (newState) {
      await this.room.localParticipant.setScreenShareEnabled(true);
    } else {
      await this.room.localParticipant.setScreenShareEnabled(false);
    }
  }

  toggleChat(): void {
    const next = !this.showChat();
    this.showChat.set(next);

    if (next) {
      this.streamChat.markRead().catch(() => undefined);
    }
  }

  sendMessage(): void {
    const messageText = this.currentMessage().trim();

    if (!messageText) return;

    this.streamChat.send(messageText).catch((err) => {
      console.error('Error sending Stream message', err);
    });
    
    // Limpiar input
    this.currentMessage.set('');
  }

  updateMessageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentMessage.set(input.value);
  }

  endCall(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }

    // Desconectar de LiveKit
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }

    // Disconnect Stream Chat
    this.streamChat.disconnect().catch(() => undefined);
    
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

  trackByMessageIndex = (index: number): number => index;
}
