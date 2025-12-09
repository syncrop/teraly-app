import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink]
})
export class FooterComponent {
  private authService = inject(AuthService);

  get isDoctor(): boolean {
    return this.authService.currentUserRole() === 'doctor';
  }

  isActive(path: string): boolean {
    // This will be enhanced with actual route detection in a real app
    return false;
  }
}
