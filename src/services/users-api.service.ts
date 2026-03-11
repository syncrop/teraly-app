import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { AppUser } from '../models/user.model';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

export type UserRoleFilter = 'doctor' | 'client';

@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  private readonly api = inject(ApiClientService);

  getMe(): Observable<AppUser> {
    return this.api.get<AppUser>('/v1/me');
  }

  upsertMe(payload: Partial<AppUser>): Observable<AppUser> {
    return this.api.put<AppUser>('/v1/me', payload);
  }

  getUserById(uid: string): Observable<AppUser | null> {
    return this.api.get<AppUser | null>(`/v1/users/${encodeURIComponent(uid)}`);
  }

  /**
   * Public doctor profile.
   * Does not require the requester to have a backend profile.
   * Backend returns a sanitized AppUser (email is empty string).
   */
  getPublicDoctorById(uid: string): Observable<AppUser | null> {
    return this.api.get<AppUser>(`/v1/public/doctors/${encodeURIComponent(uid)}`).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          return of(null);
        }
        return throwError(() => err);
      })
    );
  }

  listUsersByRole(role: UserRoleFilter): Observable<AppUser[]> {
    return this.api.get<AppUser[]>('/v1/users', { role });
  }

  updateMyProfilePicture(photoURL: string): Observable<{ success: boolean }>{
    return this.api.patch<{ success: boolean }>('/v1/me/profile-picture', { photoURL });
  }

  removeMyProfilePicture(): Observable<{ success: boolean }>{
    return this.api.delete<{ success: boolean }>('/v1/me/profile-picture');
  }

  deleteMe(): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>('/v1/me');
  }
}
