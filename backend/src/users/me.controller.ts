import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { UsersService, AppUser, UserRole } from './users.service';

const UpsertMeSchema = z
  .object({
    email: z.string().email().optional(),
    fullName: z.string().min(1).optional(),
    role: z.enum(['client', 'doctor']).optional(),
    completed: z.boolean().optional(),
    photoURL: z.string().url().nullable().optional(),
    phone: z
      .union([z.string(), z.number()])
      .transform((v) => String(v))
      .nullable()
      .optional(),
    spokenLanguage: z
      .union([z.string(), z.number()])
      .transform((v) => String(v))
      .nullable()
      .optional(),
    specialty: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    available: z.boolean().optional(),
    licenseNumber: z.string().optional(),
    isVerified: z.boolean().optional(),
    languages: z.array(z.string()).optional(),
    description: z.string().optional(),
    experience: z.number().int().nonnegative().optional(),
    ratings: z.number().nonnegative().optional(),
    reviewsCount: z.number().int().nonnegative().optional(),
    price: z.number().nonnegative().optional(),
    currency: z.string().optional(),
    sessionDuration: z.number().int().positive().optional(),
    breakTime: z.number().int().nonnegative().optional(),
    availability: z
      .array(
        z
          .object({
            day: z.string(),
            dayName: z.string().optional(),
            enabled: z.boolean(),
            slots: z.array(z.object({ start: z.string(), end: z.string() })),
            isExpanded: z.boolean().optional(),
          })
          .passthrough()
      )
      .optional(),
    blockedDates: z
      .array(
        z
          .object({
            startDate: z.string(),
            endDate: z.string(),
            reason: z.string(),
            dateRange: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
    pricePerSession: z.string().optional(),
  })
  .passthrough();

const ProfilePictureSchema = z.object({
  photoURL: z.string().url().nullable(),
});

@Controller('me')
@UseGuards(FirebaseAuthGuard)
export class MeController {
  constructor(
    private readonly users: UsersService,
    private readonly firebaseAdmin: FirebaseAdminService
  ) {}

  @Get()
  async getMe(@CurrentUser() user: any): Promise<AppUser> {
    const profile = await this.users.getByUid(user.uid);
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  @Put()
  async upsertMe(@CurrentUser() user: any, @Body() body: unknown): Promise<AppUser> {
    const parsed = UpsertMeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ForbiddenException('Invalid payload');
    }

    // Enforce role presence on first-time profile creation.
    const existing = await this.users.getByUid(user.uid);
    if (!existing) {
      const role = (parsed.data as any).role as UserRole | undefined;
      if (!role) {
        throw new ForbiddenException('Missing role');
      }
    }

    return this.users.upsertMe(user.uid, parsed.data as Partial<AppUser>);
  }

  @Patch('profile-picture')
  async updateProfilePicture(@CurrentUser() user: any, @Body() body: unknown): Promise<{ success: boolean }> {
    const parsed = ProfilePictureSchema.safeParse(body);
    if (!parsed.success) {
      throw new ForbiddenException('Invalid payload');
    }

    await this.users.updateProfilePicture(user.uid, parsed.data.photoURL);
    return { success: true };
  }

  @Delete('profile-picture')
  async removeProfilePicture(@CurrentUser() user: any): Promise<{ success: boolean }> {
    await this.users.updateProfilePicture(user.uid, null);
    return { success: true };
  }

  @Delete()
  async deleteMe(@CurrentUser() user: any): Promise<{ success: boolean }> {
    // 1) Delete app data first (Mongo). If DB is unavailable, fail without deleting Auth user.
    await this.users.deleteAccountData(user.uid);

    // 2) Best-effort delete Firebase Auth user.
    try {
      await this.firebaseAdmin.auth().deleteUser(user.uid);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code !== 'auth/user-not-found') {
        throw err;
      }
    }

    return { success: true };
  }
}
