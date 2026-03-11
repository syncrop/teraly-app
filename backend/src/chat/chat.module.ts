import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AppointmentsModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
