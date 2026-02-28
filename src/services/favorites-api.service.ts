import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';

@Injectable({
  providedIn: 'root',
})
export class FavoritesApiService {
  private readonly api = inject(ApiClientService);

  addFavorite(doctorId: string): Observable<{ success: boolean }>{
    return this.api.post<{ success: boolean }>(`/v1/me/favorites/${encodeURIComponent(doctorId)}`, {});
  }

  removeFavorite(doctorId: string): Observable<{ success: boolean }>{
    return this.api.delete<{ success: boolean }>(`/v1/me/favorites/${encodeURIComponent(doctorId)}`);
  }

  isFavorite(doctorId: string): Observable<{ isFavorite: boolean }>{
    return this.api.get<{ isFavorite: boolean }>(`/v1/me/favorites/${encodeURIComponent(doctorId)}`);
  }

  listMyFavorites(): Observable<{ doctorIds: string[] }>{
    return this.api.get<{ doctorIds: string[] }>('/v1/me/favorites');
  }
}
