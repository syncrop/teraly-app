import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './services/i18n.service';
import { ToastComponent } from './components/shared/toast/toast.component';
import { LoaderComponent } from './components/shared/loader/loader.component';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
    <app-loader></app-loader>
  `,
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastComponent, LoaderComponent]
})
export class AppComponent {
  constructor() {
    // Initialize the service at startup
    inject(I18nService);
    this.initializeStatusBar();
  }

  private async initializeStatusBar() {
    if (Capacitor.isNativePlatform()) {
      try {
        // setStyle funciona en iOS y Android
        await StatusBar.setStyle({ style: Style.Light });
        
        // setBackgroundColor solo funciona en Android
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
        }
      } catch (error) {
        // Error al configurar StatusBar
      }
    }
  }
}
