import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateDoctorReviewInput } from './reviews.types';

const ListSchema = z.object({
  doctorId: z.string().min(1),
});

const CanReviewSchema = z.object({
  doctorId: z.string().min(1),
  appointmentId: z.string().min(1),
});

@Controller('reviews')
@UseGuards(FirebaseAuthGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  async list(@CurrentUser() user: any, @Query() query: unknown) {
    const parsed = ListSchema.parse(query);
    return this.reviews.listByDoctor(user.uid, parsed.doctorId);
  }

  @Get('can-review')
  async canReview(@CurrentUser() user: any, @Query() query: unknown) {
    const parsed = CanReviewSchema.parse(query);
    return this.reviews.canReview(user.uid, parsed.doctorId, parsed.appointmentId);
  }

  @Get(':doctorId/mine')
  async mine(@CurrentUser() user: any, @Param('doctorId') doctorId: string) {
    return this.reviews.getMyReviewForDoctor(user.uid, doctorId);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() body: CreateDoctorReviewInput) {
    return this.reviews.create(user.uid, body);
  }
}
