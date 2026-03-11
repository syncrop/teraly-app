import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { AppUser, UsersService } from './users.service';

@Controller('public/doctors')
export class PublicDoctorsController {
  constructor(private readonly users: UsersService) {}

  @Get(':uid')
  async getPublicDoctor(@Param('uid') uid: string): Promise<AppUser> {
    const user = await this.users.getByUid(uid);

    if (!user || user.role !== 'doctor') {
      throw new NotFoundException('Doctor not found');
    }

    // Optional: only expose completed profiles publicly.
    if (user.completed === false) {
      throw new NotFoundException('Doctor not found');
    }

    // Remove sensitive fields.
    const { email: _email, phone: _phone, licenseNumber: _licenseNumber, ...rest } = user;

    return {
      ...rest,
      email: '',
    };
  }
}
