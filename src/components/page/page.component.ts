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

  constructor() {
    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Hide footer on doctor detail page
      this.showFooter.set(!event.url.includes('/doctor/'));
    });
  }

  logout() {
    this.authService.logout();
  }
}
