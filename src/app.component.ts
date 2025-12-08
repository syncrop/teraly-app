import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './services/i18n.service';
import { ToastComponent } from './components/shared/toast/toast.component';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `,
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastComponent]
})
export class AppComponent {
  constructor() {
    // Initialize the service at startup
    inject(I18nService);
  }
}
