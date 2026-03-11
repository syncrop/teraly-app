import { z } from 'zod';

export const EnsureAppointmentChannelSchema = z.object({
  appointmentId: z.string().trim().min(1),
  members: z.array(z.string().trim().min(1)).min(1).max(10),
});

export type EnsureAppointmentChannelDto = z.infer<typeof EnsureAppointmentChannelSchema>;
