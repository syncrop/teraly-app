import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  i18nService = inject(I18nService);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  changeLanguage(langCode: string) {
    this.i18nService.setLanguage(langCode);
  }
}
