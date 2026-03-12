import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { StreamChat } from 'stream-chat';

export type StreamTokenResponse = {
  apiKey: string;
  token: string;
  user: {
    id: string;
    name?: string;
    image?: string;
  };
};

@Injectable()
export class ChatService {
  private serverClient: StreamChat | null = null;
  private serverClientApiKey: string | null = null;

  getApiKey(): string {
    const apiKey =
      process.env.STREAM_CHAT_API_KEY ||
      process.env.STREAM_API_KEY ||
      process.env.GETSTREAM_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableException('Stream Chat is not configured (missing STREAM_CHAT_API_KEY)');
    }

    return apiKey;
  }

  private getApiSecret(): string {
    const apiSecret =
      process.env.STREAM_CHAT_API_SECRET ||
      process.env.STREAM_API_SECRET ||
      process.env.GETSTREAM_API_SECRET;

    if (!apiSecret) {
      throw new ServiceUnavailableException('Stream Chat is not configured (missing STREAM_CHAT_API_SECRET)');
    }

    return apiSecret;
  }

  private getServerClient(): StreamChat {
    const apiKey = this.getApiKey();
    const apiSecret = this.getApiSecret();

    // Avoid mismatches when env vars change but the process stays up.
    // Stream tokens must be signed with the secret that belongs to the same apiKey.
    if (this.serverClient && this.serverClientApiKey === apiKey) {
      return this.serverClient;
    }

    this.serverClientApiKey = apiKey;

    this.serverClient = StreamChat.getInstance(apiKey, apiSecret);
    return this.serverClient;
  }

  async createUserToken(params: {
    userId: string;
    name?: string;
    image?: string;
  }): Promise<StreamTokenResponse> {
    const apiKey = this.getApiKey();
    const client = this.getServerClient();

    // Best-effort: create/update the user on Stream so names/avatars show up.
    try {
      await client.upsertUser({
        id: params.userId,
        name: params.name,
        image: params.image,
      });
    } catch {
      // Ignore upsert errors (token generation can still work)
    }

    const token = client.createToken(params.userId);

    return {
      apiKey,
      token,
      user: {
        id: params.userId,
        name: params.name,
        image: params.image,
      },
    };
  }

  appointmentChannelId(appointmentId: string): string {
    const safe = appointmentId.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `appointment-${safe}`;
  }

  directMessageChannelId(userA: string, userB: string): string {
    const a = userA.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const b = userB.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const [first, second] = [a, b].sort();
    return `dm-${first}-${second}`;
  }

  async ensureAppointmentChannel(params: {
    appointmentId: string;
    members: string[];
  }): Promise<{ channelType: 'messaging'; channelId: string }> {
    const client = this.getServerClient();

    const channelId = this.appointmentChannelId(params.appointmentId);
    const members = Array.from(new Set(params.members.map((m) => m.trim()).filter(Boolean)));

    const channel = client.channel('messaging', channelId, {
      members,
    });

    // If it already exists, create() may throw. We still want it to be usable.
    try {
      await channel.create();
    } catch {
      // ignore
    }

    // Ensure members are included.
    try {
      await channel.addMembers(members);
    } catch {
      // ignore
    }

    return { channelType: 'messaging', channelId };
  }

  async ensureDirectMessageChannel(params: {
    requesterId: string;
    otherUserId: string;
  }): Promise<{ channelType: 'messaging'; channelId: string }> {
    const client = this.getServerClient();

    const members = Array.from(
      new Set([params.requesterId, params.otherUserId].map((m) => m.trim()).filter(Boolean))
    );

    const channelId = this.directMessageChannelId(params.requesterId, params.otherUserId);

    const channel = client.channel('messaging', channelId, {
      members,
    });

    try {
      await channel.create();
    } catch {
      // ignore
    }

    try {
      await channel.addMembers(members);
    } catch {
      // ignore
    }

    return { channelType: 'messaging', channelId };
  }
}
