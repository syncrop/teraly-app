import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StreamChat } from 'stream-chat';
import { AuthService } from './auth.service';
import { ChatApiService } from './chat-api.service';
import type { Appointment } from '../models/appointment.model';

export type ChatMessage = Readonly<{
  id: string;
  text: string;
  sender: string;
  time: string;
  isOwn: boolean;
}>;

@Injectable({
  providedIn: 'root',
})
export class StreamChatService {
  private readonly auth = inject(AuthService);
  private readonly chatApi = inject(ChatApiService);

  private client: StreamChat | null = null;
  private channel: any | null = null;
  private unsubscribeChannelEvents: (() => void) | null = null;

  readonly isConnected = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly unreadCount = computed(() => this.messages().filter((m) => !m.isOwn).length);

  async connectToDirectMessage(otherUserId: string): Promise<void> {
    await this.auth.waitForInitialization();

    const currentUid = this.auth.getCurrentUserId();
    if (!currentUid) {
      throw new Error('Missing current user id');
    }

    const otherId = String(otherUserId || '').trim();
    if (!otherId) {
      throw new Error('Missing other user id');
    }

    // Refresh connection (safe to call multiple times).
    if (this.client && this.channel) {
      const existingId = this.channel.id;

      const channelResponse = await firstValueFrom(this.chatApi.ensureDirectMessageChannel(otherId));
      if (existingId === channelResponse.channelId) {
        return;
      }

      await this.disconnect();
    }

    const tokenResponse = await firstValueFrom(this.chatApi.getStreamToken());
    const client = StreamChat.getInstance(tokenResponse.apiKey);

    const userName = this.auth.currentUser()?.fullName || tokenResponse.user.name || currentUid;
    const userImage = this.auth.currentUser()?.photoURL || tokenResponse.user.image;

    await client.connectUser(
      {
        id: tokenResponse.user.id,
        name: userName,
        image: userImage,
      },
      tokenResponse.token
    );

    const channelResponse = await firstValueFrom(this.chatApi.ensureDirectMessageChannel(otherId));
    const channel = client.channel(channelResponse.channelType, channelResponse.channelId);
    await channel.watch();

    try {
      await channel.query({ messages: { limit: 50 } });
    } catch {
      // ignore
    }

    this.client = client;
    this.channel = channel;
    this.isConnected.set(true);

    this.messages.set(this.mapMessages(channel.state.messages || [], currentUid));

    const subscription = channel.on('message.new', () => {
      const stateMessages = channel.state.messages || [];
      this.messages.set(this.mapMessages(stateMessages, currentUid));
    });

    this.unsubscribeChannelEvents = () => subscription.unsubscribe();
  }

  async connectToAppointment(appointment: Appointment): Promise<void> {
    await this.auth.waitForInitialization();

    const currentUid = this.auth.getCurrentUserId();
    if (!currentUid) {
      throw new Error('Missing current user id');
    }

    // Refresh connection (safe to call multiple times).
    if (this.client && this.channel) {
      const existingId = this.channel.id;
      const desiredId = this.toAppointmentChannelId(appointment.id);
      if (existingId === desiredId) {
        return;
      }

      await this.disconnect();
    }

    const tokenResponse = await firstValueFrom(this.chatApi.getStreamToken());

    const client = StreamChat.getInstance(tokenResponse.apiKey);

    const userName = this.auth.currentUser()?.fullName || tokenResponse.user.name || currentUid;
    const userImage = this.auth.currentUser()?.photoURL || tokenResponse.user.image;

    await client.connectUser(
      {
        id: tokenResponse.user.id,
        name: userName,
        image: userImage,
      },
      tokenResponse.token
    );

    const channelResponse = await firstValueFrom(this.chatApi.ensureAppointmentChannel(appointment.id));

    const channel = client.channel(channelResponse.channelType, channelResponse.channelId);
    await channel.watch();

    // Best-effort: load some history. Different SDK versions support different options.
    try {
      await channel.query({ messages: { limit: 50 } });
    } catch {
      // ignore
    }

    this.client = client;
    this.channel = channel;
    this.isConnected.set(true);

    this.messages.set(this.mapMessages(channel.state.messages || [], currentUid));

    const subscription = channel.on('message.new', () => {
      const stateMessages = channel.state.messages || [];
      this.messages.set(this.mapMessages(stateMessages, currentUid));
    });

    this.unsubscribeChannelEvents = () => subscription.unsubscribe();
  }

  async send(text: string): Promise<void> {
    const messageText = text.trim();
    if (!messageText) return;
    if (!this.channel) throw new Error('Chat channel is not ready');

    await this.channel.sendMessage({ text: messageText });
  }

  async disconnect(): Promise<void> {
    this.unsubscribeChannelEvents?.();
    this.unsubscribeChannelEvents = null;

    try {
      await this.channel?.stopWatching();
    } catch {
      // ignore
    }

    this.channel = null;

    try {
      await this.client?.disconnectUser();
    } catch {
      // ignore
    }

    this.client = null;
    this.isConnected.set(false);
    this.messages.set([]);
  }

  private mapMessages(raw: Array<any>, currentUid: string): ChatMessage[] {
    return raw
      .filter((m) => typeof m?.text === 'string' && m.text.trim().length)
      .map((m) => {
        const created = m?.created_at ? new Date(m.created_at) : new Date();
        const time = created.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const senderId = String(m?.user?.id ?? '');
        const senderName = String(m?.user?.name ?? senderId ?? '');

        return {
          id: String(m?.id ?? `${created.getTime()}-${senderId}`),
          text: String(m.text),
          sender: senderName || senderId || 'Usuario',
          time,
          isOwn: senderId === currentUid,
        } as ChatMessage;
      });
  }

  private toAppointmentChannelId(appointmentId: string): string {
    const safe = appointmentId.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `appointment-${safe}`;
  }
}
