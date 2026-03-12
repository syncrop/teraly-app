import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AppointmentService } from '../../../../services/appointment.service';
import { AuthService } from '../../../../services/auth.service';
import type { Appointment } from '../../../../models/appointment.model';

type ConversationItem = Readonly<{
  peerId: string;
  peerName: string;
  peerAvatar: string;
  lastActivityAt: number;
  lastActivityLabel: string;
  summary: string;
}>;

@Component({
  selector: 'app-conversations-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conversations-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationsListComponent implements OnInit, OnDestroy {
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly isLoading = signal(true);
  readonly conversations = signal<ConversationItem[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openConversation(peerId: string): void {
    if (!peerId) return;
    this.router.navigate(['/app/chat/dm', peerId]);
  }

  getInitials(name: string): string {
    const value = String(name || '').trim();
    if (!value) return 'U';

    return value
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private async loadConversations(): Promise<void> {
    await this.authService.waitForInitialization();

    const userId = this.authService.getCurrentUserId();
    const role = this.authService.currentUserRole();

    if (!userId || (role !== 'doctor' && role !== 'client')) {
      this.conversations.set([]);
      this.isLoading.set(false);
      return;
    }

    const appointments$ = role === 'doctor'
      ? this.appointmentService.getDoctorAppointments(userId)
      : this.appointmentService.getClientAppointments(userId);

    appointments$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.conversations.set(this.buildConversationItems(appointments || [], role));
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading conversations:', error);
          this.conversations.set([]);
          this.isLoading.set(false);
        },
      });
  }

  private buildConversationItems(
    appointments: Appointment[],
    role: 'doctor' | 'client'
  ): ConversationItem[] {
    const byPeer = new Map<string, ConversationItem>();

    for (const appointment of appointments) {
      // DM endpoint requires at least one non-cancelled appointment between both users.
      if (appointment.status === 'cancelled') continue;

      const peerId = role === 'doctor' ? appointment.clientId : appointment.doctorId;
      if (!peerId) continue;

      const peerName = role === 'doctor'
        ? String(appointment.clientName || '').trim()
        : String(appointment.doctorName || '').trim();

      const peerAvatar = role === 'doctor'
        ? String(appointment.clientPhoto || '').trim()
        : String(appointment.doctorPhotoUrl || '').trim();

      const dateLabel = this.formatDateLabel(appointment.date);
      const summary = `${dateLabel} · ${appointment.startTime}`;
      const lastActivityAt = this.toEpoch(appointment.date, appointment.startTime);

      const nextItem: ConversationItem = {
        peerId,
        peerName: peerName || $localize`:@@chat.defaultPeerName:Usuario`,
        peerAvatar,
        lastActivityAt,
        lastActivityLabel: this.formatLastActivity(lastActivityAt),
        summary,
      };

      const existing = byPeer.get(peerId);
      if (!existing || existing.lastActivityAt < nextItem.lastActivityAt) {
        byPeer.set(peerId, nextItem);
      }
    }

    return Array.from(byPeer.values()).sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }

  private toEpoch(date: string, time: string): number {
    const raw = `${date}T${time}:00`;
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private formatLastActivity(epochMs: number): string {
    if (!epochMs) return '';

    const value = new Date(epochMs);
    const now = new Date();

    const valueDate = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (valueDate === nowDate) {
      return value.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    if (valueDate === nowDate - 24 * 60 * 60 * 1000) {
      return $localize`:@@chat.lastActivityYesterday:Ayer`;
    }

    return value.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  private formatDateLabel(dateIso: string): string {
    const parsed = Date.parse(`${dateIso}T00:00:00`);
    if (Number.isNaN(parsed)) return dateIso;

    const value = new Date(parsed);
    return value.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }
}
