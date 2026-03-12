import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../../services/toast.service';
import { StreamChatService } from '../../../../services/stream-chat.service';
import { UsersApiService } from '../../../../services/users-api.service';

@Component({
  selector: 'app-direct-message-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './direct-message-chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectMessageChatComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);
  readonly streamChat = inject(StreamChatService);
  private readonly usersApi = inject(UsersApiService);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;

  readonly isLoading = signal(true);
  readonly doctorId = signal<string>('');
  readonly doctorName = signal<string>($localize`:@@chat.doctorFallbackName:Profesional`);
  readonly doctorAvatar = signal<string>('');

  readonly draft = signal('');
  readonly isSending = signal(false);

  readonly messages = this.streamChat.messages;

  private readonly autoScroll = effect(() => {
    // Re-run whenever messages change.
    const count = this.messages().length;
    if (count < 1) return;

    // Defer to let DOM render.
    queueMicrotask(() => this.scrollToBottom());
  });

  async ngOnInit(): Promise<void> {
    const id = String(this.route.snapshot.paramMap.get('id') || '').trim();
    if (!id) {
      this.toast.error($localize`:@@toast.chat.missingDoctorId:Falta el id del profesional`);
      this.goBack();
      return;
    }

    this.doctorId.set(id);
    this.isLoading.set(true);

    // Load doctor basic info for header (best-effort).
    try {
      const doctorData = await firstValueFrom(this.usersApi.getPublicDoctorById(id));
      const name = String(doctorData?.fullName || '').trim();
      const photo = String(doctorData?.photoURL || '').trim();

      if (name) this.doctorName.set(name);
      if (photo) this.doctorAvatar.set(photo);
    } catch {
      // ignore; we can still chat.
    }

    try {
      await this.streamChat.connectToDirectMessage(id);

      // Mark as read as soon as the chat screen opens.
      await this.streamChat.markRead();

      this.isLoading.set(false);
      queueMicrotask(() => this.scrollToBottom());
    } catch (err: any) {
      console.error('Error connecting to DM chat:', err);

      const status = typeof err?.status === 'number' ? err.status : undefined;
      if (status === 403) {
        this.toast.error(
          $localize`:@@toast.chat.notAllowed:No tienes permisos para iniciar un chat con este profesional.`
        );
      } else {
        this.toast.error(
          $localize`:@@toast.chat.connectError:No se pudo abrir el chat. Intenta de nuevo.`
        );
      }

      this.isLoading.set(false);
      this.goBack();
    }
  }

  ngOnDestroy(): void {
    // Best-effort clean up.
    this.streamChat.disconnect().catch(() => undefined);
    this.autoScroll.destroy();
  }

  goBack(): void {
    this.location.back();
  }

  async send(): Promise<void> {
    const text = this.draft().trim();
    if (!text) return;

    this.isSending.set(true);
    try {
      await this.streamChat.send(text);
      this.draft.set('');
      queueMicrotask(() => this.scrollToBottom());
    } catch (err) {
      console.error('Error sending message:', err);
      this.toast.error($localize`:@@toast.chat.sendError:No se pudo enviar el mensaje`);
    } finally {
      this.isSending.set(false);
    }
  }

  onDraftKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;

    event.preventDefault();
    void this.send();
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
}
