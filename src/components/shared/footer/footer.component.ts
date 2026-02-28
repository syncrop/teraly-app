import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { filter, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink]
})
export class FooterComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  get isDoctor(): boolean {
    return this.authService.currentUserRole() === 'doctor';
  }

  ngOnInit() {
    // Subscribe to router events to detect changes and update the view
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isActive(path: string): boolean {
    const currentUrl = this.router.url;

    // Home tab activo si es /app, /app/, /app/home-doctor o /app/home-client
    if (path === '/app') {
      return (
        currentUrl === '/app' ||
        currentUrl === '/app/' ||
        currentUrl === '/app/home-doctor' ||
        currentUrl === '/app/home-client'
      );
    }

    // Match si la URL incluye el path
    return currentUrl.includes(path);
  }

  /**
   * Navegar a home y hacer scroll al principio
   */
  navigateToHome(event: Event) {
    event.preventDefault();
    const homeRoute = this.isDoctor ? '/app/home-doctor' : '/app/home-client';
    
    // Si ya estamos en home, solo hacer scroll
    if (this.router.url === homeRoute) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navegar y luego hacer scroll
      this.router.navigate([homeRoute]).then(() => {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      });
    }
  }
}
