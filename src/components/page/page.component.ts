import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../shared/logo/logo.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, FooterComponent],
})
export class PageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  userRole = this.authService.currentUserRole;
  showFooter = signal(true);
  showHeader = signal(true);

  constructor() {
    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const isVideoCall = event.url.includes('/video-call');
      
      // Hide footer only on video-call
      this.showFooter.set(!isVideoCall);
      
      // Hide header on video-call
      this.showHeader.set(!isVideoCall);
    });
  }

  isHomeActive(): boolean {
    const homeRoute = this.userRole() === 'client' ? '/app/home-client' : '/app/home-doctor';
    return this.router.url === homeRoute;
  }

  navigateToHome(event: Event) {
    event.preventDefault();
    const homeRoute = this.userRole() === 'client' ? '/app/home-client' : '/app/home-doctor';
    
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

  logout() {
    this.authService.logout();
  }
}
