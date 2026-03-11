import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from '@angular/fire/firestore';
import { Capacitor } from '@capacitor/core';
import { from, map, Observable, of, switchMap, catchError } from 'rxjs';
import { FirestoreHelperService } from './firestore-helper.service';
import { FirestoreNativeService } from './firestore-native.service';
import { CreateDoctorReviewInput, DoctorReview } from '../models/review.model';
import { isBackendEnabled } from '../config/backend.config';
import { ReviewsApiService } from './reviews-api.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly firestore = inject(Firestore);
  private readonly firestoreHelper = inject(FirestoreHelperService);
  private readonly firestoreNative = inject(FirestoreNativeService);
  private readonly reviewsApi = inject(ReviewsApiService);

  private readonly reviewsCollection = collection(this.firestore, 'reviews');

  /** Returns all reviews authored by a client (Firestore-only). */
  getClientReviews(clientId: string): Observable<DoctorReview[]> {
    if (isBackendEnabled()) {
      // Backend doesn't expose this endpoint yet.
      return of([]);
    }

    return from(this.firestoreHelper.getDocuments<any>('reviews', where('clientId', '==', clientId))).pipe(
      map((docs) =>
        (docs ?? [])
          .map((d) => this.normalizeReview(d))
          .filter((r): r is DoctorReview => !!r)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      ),
      catchError((err) => {
        console.error('Error loading my reviews:', err);
        return of([]);
      })
    );
  }

  getDoctorReviews(doctorId: string): Observable<DoctorReview[]> {
    if (isBackendEnabled()) {
      return this.reviewsApi.getDoctorReviews(doctorId).pipe(
        map((docs) =>
          (docs ?? [])
            .map((d) => this.normalizeReview(d))
            .filter((r): r is DoctorReview => !!r)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        ),
        catchError((err) => {
          console.error('Error loading reviews (backend):', err);
          return of([]);
        })
      );
    }

    return from(this.firestoreHelper.getDocuments<any>('reviews', where('doctorId', '==', doctorId))).pipe(
      map((docs) =>
        (docs ?? [])
          .map((d) => this.normalizeReview(d))
          .filter((r): r is DoctorReview => !!r)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      ),
      catchError((err) => {
        console.error('Error loading reviews:', err);
        return of([]);
      })
    );
  }

  getReviewForDoctor(doctorId: string, clientId: string): Observable<DoctorReview | null> {
    if (isBackendEnabled()) {
      // clientId is ignored; backend uses authenticated user
      return this.reviewsApi.getMyReviewForDoctor(doctorId).pipe(
        map((docData) => (docData ? this.normalizeReview(docData) : null)),
        catchError((err) => {
          console.error('Error loading my review (backend):', err);
          return of(null);
        })
      );
    }

    const reviewId = this.buildReviewId(doctorId, clientId);

    return from(this.firestoreHelper.getDocument<any>('reviews', reviewId)).pipe(
      map((docData) => (docData ? this.normalizeReview(docData) : null)),
      catchError((err) => {
        console.error('Error loading my review:', err);
        return of(null);
      })
    );
  }

  createReview(input: CreateDoctorReviewInput): Observable<boolean> {
    if (isBackendEnabled()) {
      return this.reviewsApi.createReview(input).pipe(
        map((r) => !!r?.success),
        catchError((err) => {
          console.error('Error creating review (backend):', err);
          return of(false);
        })
      );
    }

    const reviewId = this.buildReviewId(input.doctorId, input.clientId);
    const nowTs = Timestamp.now();

    const payload = {
      doctorId: input.doctorId,
      clientId: input.clientId,
      appointmentId: input.appointmentId,
      rating: input.rating,
      comment: input.comment,
      clientName: input.clientName,
      clientAvatar: input.clientAvatar ?? null,
      createdAt: nowTs,
      updatedAt: nowTs,
    };

    if (Capacitor.isNativePlatform()) {
      // REST: upsert; Firestore rules should prevent overwriting if you want create-only.
      return from(this.firestoreNative.setDocument('reviews', reviewId, payload)).pipe(
        map((ok) => !!ok),
        catchError((err) => {
          console.error('Error creating review (native):', err);
          return of(false);
        })
      );
    }

    const reviewRef = doc(this.reviewsCollection, reviewId);
    return from(setDoc(reviewRef, payload)).pipe(
      map(() => true),
      catchError((err) => {
        console.error('Error creating review:', err);
        return of(false);
      })
    );
  }

  /** Utility: checks appointment ownership/completed server-side should be enforced by rules; this is UI gating only. */
  canUserReviewDoctor(clientId: string, doctorId: string, appointmentId: string): Observable<boolean> {
    if (isBackendEnabled()) {
      // clientId is ignored; backend uses authenticated user
      return this.reviewsApi.canReview({ doctorId, appointmentId }).pipe(
        map((r) => !!r?.canReview),
        catchError(() => of(false))
      );
    }

    return this.getReviewForDoctor(doctorId, clientId).pipe(
      switchMap((existing) => {
        if (existing) return of(false);
        return this.isCompletedAppointmentForDoctor(clientId, doctorId, appointmentId);
      })
    );
  }

  isCompletedAppointmentForDoctor(clientId: string, doctorId: string, appointmentId: string): Observable<boolean> {
    return from(this.firestoreHelper.getDocument<any>('appointments', appointmentId)).pipe(
      map((apt) => {
        if (!apt) return false;
        return apt.clientId === clientId && apt.doctorId === doctorId && apt.status === 'completed';
      }),
      catchError(() => of(false))
    );
  }

  private buildReviewId(doctorId: string, clientId: string): string {
    return `${doctorId}_${clientId}`;
  }

  private normalizeReview(raw: any): DoctorReview | null {
    if (!raw) return null;

    const createdAt = this.toDate(raw.createdAt);
    const updatedAt = this.toDate(raw.updatedAt ?? raw.createdAt);

    return {
      id: String(raw.id ?? raw.reviewId ?? ''),
      doctorId: String(raw.doctorId ?? ''),
      clientId: String(raw.clientId ?? ''),
      appointmentId: String(raw.appointmentId ?? ''),
      rating: Number(raw.rating ?? 0),
      comment: String(raw.comment ?? ''),
      clientName: String(raw.clientName ?? raw.name ?? 'Usuario'),
      clientAvatar: raw.clientAvatar ?? raw.avatar ?? null,
      createdAt,
      updatedAt,
    };
  }

  private toDate(value: any): Date {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;

    // Firestore Timestamp
    if (typeof value?.toDate === 'function') {
      return value.toDate();
    }

    // ISO string
    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? new Date(0) : d;
    }

    return new Date(0);
  }
}
