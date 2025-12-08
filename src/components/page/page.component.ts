import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../shared/logo/logo.component';
import { FooterComponent } from '../shared/footer/footer.component';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, FooterComponent],
})
export class PageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  userRole = this.authService.currentUserRole;

  logout() {
    this.authService.logout();
  }
}
