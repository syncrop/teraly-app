import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { UsersService, AppUser, UserRole } from './users.service';

const RoleQuerySchema = z.object({
  role: z.enum(['doctor', 'client']).optional(),
});

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(@CurrentUser() requester: any, @Query() query: unknown): Promise<AppUser[]> {
    const parsed = RoleQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ForbiddenException('Invalid query');
    }

    const requesterProfile = await this.users.getByUid(requester.uid);
    if (!requesterProfile) {
      throw new ForbiddenException('Missing profile');
    }

    const role = parsed.data.role;
    if (!role) {
      // Conservative default: do not allow listing all users.
      throw new ForbiddenException('Missing role filter');
    }

    // Allow everyone to list doctors.
    if (role === 'doctor') {
      return this.users.listByRole('doctor');
    }

    // Listing clients: only doctors can do this.
    if (requesterProfile.role !== 'doctor') {
      throw new ForbiddenException('Not allowed');
    }

    return this.users.listByRole('client');
  }

  @Get(':uid')
  async getById(@CurrentUser() requester: any, @Param('uid') uid: string): Promise<AppUser | null> {
    const requesterProfile = await this.users.getByUid(requester.uid);
    if (!requesterProfile) {
      throw new ForbiddenException('Missing profile');
    }

    const user = await this.users.getByUid(uid);
    if (!user) return null;

    // A client can view doctors and themselves.
    if (requesterProfile.role === 'client') {
      if (uid === requester.uid) return user;
      if (user.role === 'doctor') return user;
      throw new ForbiddenException('Not allowed');
    }

    // Doctors can view anyone (server-side rules may be tightened later).
    return user;
  }
}
