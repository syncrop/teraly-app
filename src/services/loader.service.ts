import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Muestra el loader
   */
  show(): void {
    this.loadingSubject.next(true);
  }

  /**
   * Oculta el loader
   */
  hide(): void {
    this.loadingSubject.next(false);
  }

  /**
   * Muestra el loader durante un tiempo específico
   * @param duration Duración en milisegundos (por defecto 2000ms)
   */
  showFor(duration: number = 2000): void {
    this.show();
    setTimeout(() => this.hide(), duration);
  }
}
