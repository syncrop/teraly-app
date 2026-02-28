import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [AuthModule, DbModule, HealthModule, UsersModule, AppointmentsModule, FavoritesModule, ReviewsModule],
})
export class AppModule {}
