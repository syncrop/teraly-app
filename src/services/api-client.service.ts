import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { BACKEND_CONFIG } from '../config/backend.config';

export type ApiQueryParams = Record<string, string | number | boolean | null | undefined>;

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return (BACKEND_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
  }

  private ensureEnabled(): void {
    if (!BACKEND_CONFIG.enabled) {
      throw new Error('Backend API is disabled (BACKEND_CONFIG.enabled=false).');
    }

    if (!this.baseUrl) {
      throw new Error('Backend API baseUrl is empty (BACKEND_CONFIG.apiBaseUrl).');
    }
  }

  private toHttpParams(params?: ApiQueryParams): HttpParams | undefined {
    if (!params) return undefined;

    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }

  get<T>(path: string, params?: ApiQueryParams, headers?: HttpHeaders): Observable<T> {
    try {
      this.ensureEnabled();
      return this.http.get<T>(`${this.baseUrl}${path}`, {
        params: this.toHttpParams(params),
        headers,
      });
    } catch (error) {
      return throwError(() => error);
    }
  }

  post<T>(path: string, body: unknown, params?: ApiQueryParams): Observable<T> {
    try {
      this.ensureEnabled();
      return this.http.post<T>(`${this.baseUrl}${path}`, body, {
        params: this.toHttpParams(params),
      });
    } catch (error) {
      return throwError(() => error);
    }
  }

  put<T>(path: string, body: unknown, params?: ApiQueryParams): Observable<T> {
    try {
      this.ensureEnabled();
      return this.http.put<T>(`${this.baseUrl}${path}`, body, {
        params: this.toHttpParams(params),
      });
    } catch (error) {
      return throwError(() => error);
    }
  }

  patch<T>(path: string, body: unknown, params?: ApiQueryParams): Observable<T> {
    try {
      this.ensureEnabled();
      return this.http.patch<T>(`${this.baseUrl}${path}`, body, {
        params: this.toHttpParams(params),
      });
    } catch (error) {
      return throwError(() => error);
    }
  }

  delete<T>(path: string, params?: ApiQueryParams): Observable<T> {
    try {
      this.ensureEnabled();
      return this.http.delete<T>(`${this.baseUrl}${path}`, {
        params: this.toHttpParams(params),
      });
    } catch (error) {
      return throwError(() => error);
    }
  }
}
