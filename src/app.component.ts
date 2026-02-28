import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { I18nService } from './services/i18n.service';
import { ToastComponent } from './components/shared/toast/toast.component';
import { LoaderComponent } from './components/shared/loader/loader.component';
import { LoaderService } from './services/loader.service';
import { AuthService } from './services/auth.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
    <app-loader></app-loader>
  `,
  styles: [`
    :host { 
      min-height: 100%;
      width: 100%;
      background-color: #ffffff;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastComponent, LoaderComponent]
})
export class AppComponent {
  private router = inject(Router);
  private loaderService = inject(LoaderService);
  private authService = inject(AuthService);

  constructor() {
    // Initialize the service at startup
    inject(I18nService);
    this.initializeApp();
  }

  private async initializeApp() {
    await this.initializeStatusBar();

    if (Capacitor.isNativePlatform()) {
      this.loaderService.show();
      await this.navigateToInitialRoute();
      this.loaderService.hide();
      return;
    }

    await this.navigateToInitialRoute();
  }

  private async navigateToInitialRoute(): Promise<void> {
    const currentUser = this.authService.currentUser();
    
    if (currentUser) {
      if (currentUser.role === 'doctor') {
        await this.router.navigate(['/app/home-doctor']);
      } else {
        await this.router.navigate(['/app/home-client']);
      }
    } else {
      await this.router.navigate(['/login']);
    }
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
