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
    
    // Exact match for home
    if (path === '/app') {
      return currentUrl === '/app' || currentUrl === '/app/';
    }
    
    // Match if current URL includes the path
    return currentUrl.includes(path);
  }
}
