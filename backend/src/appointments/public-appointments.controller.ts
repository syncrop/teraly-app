import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { z } from 'zod';
import { AppointmentsService } from './appointments.service';
import { UsersService } from '../users/users.service';

const BusySlotsQuerySchema = z.object({
  doctorId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

const AvailabilityQuerySchema = z.object({
  doctorId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

export type PublicBusySlot = Readonly<{
  date: string;
  startTime: string;
  endTime: string;
}>;

@Controller('public/appointments')
export class PublicAppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly users: UsersService
  ) {}

  @Get('busy')
  async busy(@Query() query: unknown): Promise<PublicBusySlot[]> {
    const parsed = BusySlotsQuerySchema.parse(query);

    const doctor = await this.users.getByUid(parsed.doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      throw new NotFoundException('Doctor not found');
    }

    return this.appointments.listPublicBusySlots({
      doctorId: parsed.doctorId,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    });
  }

  @Get('availability')
  async availability(@Query() query: unknown): Promise<{ available: boolean }> {
    const parsed = AvailabilityQuerySchema.parse(query);

    const doctor = await this.users.getByUid(parsed.doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      throw new NotFoundException('Doctor not found');
    }

    return this.appointments.isTimeSlotAvailablePublic({
      doctorId: parsed.doctorId,
      date: parsed.date,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
    });
  }
}
