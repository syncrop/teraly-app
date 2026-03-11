import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';

export type StreamChatTokenResponse = Readonly<{
  apiKey: string;
  token: string;
  user: {
    id: string;
    name?: string;
    image?: string;
  };
}>;

export type EnsureAppointmentChannelResponse = Readonly<{
  channelType: 'messaging';
  channelId: string;
}>;

export type EnsureDirectMessageChannelResponse = Readonly<{
  channelType: 'messaging';
  channelId: string;
}>;

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private readonly api = inject(ApiClientService);

  getStreamToken(): Observable<StreamChatTokenResponse> {
    return this.api.post<StreamChatTokenResponse>('/v1/chat/token', {});
  }

  ensureAppointmentChannel(appointmentId: string): Observable<EnsureAppointmentChannelResponse> {
    return this.api.post<EnsureAppointmentChannelResponse>(
      `/v1/chat/channels/appointment/${encodeURIComponent(appointmentId)}`,
      {}
    );
  }

  ensureDirectMessageChannel(otherUserId: string): Observable<EnsureDirectMessageChannelResponse> {
    return this.api.post<EnsureDirectMessageChannelResponse>(
      `/v1/chat/channels/dm/${encodeURIComponent(otherUserId)}`,
      {}
    );
  }
}
