import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';
import { ToastService } from '../../../services/toast.service';
import { ProfilePictureComponent } from './profile-picture/profile-picture.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfilePictureComponent]
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  i18nService = inject(I18nService);
  private toastService = inject(ToastService);

  logout() {
    this.toastService.info('Cerrando sesión...');
    this.authService.logout();
  }

  changeLanguage(langCode: string) {
    this.toastService.success('Idioma cambiado correctamente');
    this.i18nService.setLanguage(langCode);
  }
}
