import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentInput, UpdateAppointmentInput } from './appointments.types';

const ListSchema = z.object({
  doctorId: z.string().optional(),
  clientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const AvailabilitySchema = z.object({
  doctorId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  excludeAppointmentId: z.string().optional(),
});

@Controller('appointments')
@UseGuards(FirebaseAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  async list(@CurrentUser() user: any, @Query() query: unknown) {
    const parsed = ListSchema.parse(query);
    return this.appointments.list({ requesterUid: user.uid, ...parsed });
  }

  @Get('availability')
  async availability(@CurrentUser() user: any, @Query() query: unknown) {
    const parsed = AvailabilitySchema.parse(query);
    return this.appointments.isTimeSlotAvailable({ requesterUid: user.uid, ...parsed });
  }

  @Get(':id')
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.appointments.getById(user.uid, id);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() body: CreateAppointmentInput) {
    return this.appointments.create(user.uid, body);
  }

  @Patch(':id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: UpdateAppointmentInput) {
    return this.appointments.update(user.uid, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.appointments.delete(user.uid, id);
  }
}
