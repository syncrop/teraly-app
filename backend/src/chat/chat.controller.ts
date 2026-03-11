import { Body, Controller, ForbiddenException, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AppointmentsService } from '../appointments/appointments.service';
import { ChatService } from './chat.service';
import { EnsureAppointmentChannelSchema } from './chat.schemas';

@Controller('chat')
@UseGuards(FirebaseAuthGuard)
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly appointments: AppointmentsService
  ) {}

  @Post('token')
  async token(@CurrentUser() requester: any) {
    const userId = String(requester?.uid || '').trim();
    if (!userId) {
      throw new ForbiddenException('Missing uid');
    }

    const name = typeof requester?.name === 'string' ? requester.name : undefined;
    const image = typeof requester?.picture === 'string' ? requester.picture : undefined;

    return this.chat.createUserToken({
      userId,
      name,
      image,
    });
  }

  /**
   * SAFE endpoint: derives channel members from the appointment (doctor+client).
   * Requester must be part of that appointment.
   */
  @Post('channels/appointment/:appointmentId')
  async ensureAppointmentChannel(@CurrentUser() requester: any, @Param('appointmentId') appointmentId: string) {
    const requesterId = String(requester?.uid || '').trim();
    if (!requesterId) {
      throw new ForbiddenException('Missing uid');
    }

    const appointment = await this.appointments.getById(requesterId, appointmentId);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const members = [appointment.doctorId, appointment.clientId].filter(Boolean);
    return this.chat.ensureAppointmentChannel({
      appointmentId: appointment.id,
      members,
    });
  }

  /**
   * SAFE endpoint: creates/returns a unique 1:1 channel between requester and the target user.
   * Only allowed if there's (or was) at least one non-cancelled appointment between them.
   */
  @Post('channels/dm/:otherUserId')
  async ensureDirectMessageChannel(@CurrentUser() requester: any, @Param('otherUserId') otherUserId: string) {
    const requesterId = String(requester?.uid || '').trim();
    if (!requesterId) {
      throw new ForbiddenException('Missing uid');
    }

    const otherId = String(otherUserId || '').trim();
    if (!otherId) {
      throw new ForbiddenException('Missing other user id');
    }

    const allowed = await this.appointments.hasNonCancelledAppointmentBetween({
      requesterUid: requesterId,
      otherUid: otherId,
    });

    if (!allowed) {
      throw new ForbiddenException('Not allowed');
    }

    return this.chat.ensureDirectMessageChannel({ requesterId, otherUserId: otherId });
  }

  /**
   * UNSAFE endpoint: allows the client to specify members.
   * Only enable for local/dev when Mongo isn't available.
   */
  @Post('channels/appointment/unsafe')
  async ensureAppointmentChannelUnsafe(@CurrentUser() requester: any, @Body() body: unknown) {
    if (process.env.ALLOW_UNSAFE_CHAT_CHANNEL_CREATION !== 'true') {
      throw new ForbiddenException('Unsafe channel creation disabled');
    }

    const parsed = EnsureAppointmentChannelSchema.safeParse(body);
    if (!parsed.success) {
      throw new ForbiddenException('Invalid payload');
    }

    const requesterId = String(requester?.uid || '').trim();
    if (!requesterId) {
      throw new ForbiddenException('Missing uid');
    }

    const members = Array.from(new Set(parsed.data.members));
    if (!members.includes(requesterId)) {
      throw new ForbiddenException('Requester must be a channel member');
    }

    return this.chat.ensureAppointmentChannel({
      appointmentId: parsed.data.appointmentId,
      members,
    });
  }
}
