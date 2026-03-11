import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MeController } from './me.controller';
import { PublicDoctorsController } from './public-doctors.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController, MeController, PublicDoctorsController],
  exports: [UsersService],
})
export class UsersModule {}
