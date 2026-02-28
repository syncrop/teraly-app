import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { CreateDoctorReviewInput, DoctorReview } from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewsApiService {
  private readonly api = inject(ApiClientService);

  getDoctorReviews(doctorId: string): Observable<DoctorReview[]> {
    return this.api.get<DoctorReview[]>('/v1/reviews', { doctorId });
  }

  getMyReviewForDoctor(doctorId: string): Observable<DoctorReview | null> {
    return this.api.get<DoctorReview | null>(`/v1/reviews/${encodeURIComponent(doctorId)}/mine`);
  }

  createReview(input: CreateDoctorReviewInput): Observable<{ success: boolean }>{
    return this.api.post<{ success: boolean }>('/v1/reviews', input);
  }

  canReview(params: { doctorId: string; appointmentId: string }): Observable<{ canReview: boolean }>{
    return this.api.get<{ canReview: boolean }>('/v1/reviews/can-review', params);
  }
}
