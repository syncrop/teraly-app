import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { AppUser } from '../models/user.model';

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

  listUsersByRole(role: UserRoleFilter): Observable<AppUser[]> {
    return this.api.get<AppUser[]>('/v1/users', { role });
  }

  updateMyProfilePicture(photoURL: string): Observable<{ success: boolean }>{
    return this.api.patch<{ success: boolean }>('/v1/me/profile-picture', { photoURL });
  }

  removeMyProfilePicture(): Observable<{ success: boolean }>{
    return this.api.delete<{ success: boolean }>('/v1/me/profile-picture');
  }
}
