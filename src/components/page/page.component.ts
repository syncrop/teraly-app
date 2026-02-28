import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../shared/logo/logo.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { CommonModule } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

  private touchStartX: number | null = null;
  private touchStartY: number | null = null;

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
      // Change root-container background for video-call
      const rootContainer = document.getElementById('root-container');
      if (rootContainer) {
        if (isVideoCall) {
          rootContainer.style.backgroundColor = '#1a202c';
        } else {
          rootContainer.style.backgroundColor = '#ffffff';
        }
      }
    });
  }

  private async triggerHaptic(style: ImpactStyle = ImpactStyle.Light, webDurationMs = 10) {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style });
        return;
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(webDurationMs);
      }
    } catch {
      // Ignore: haptics are best-effort
    }
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
      // void this.triggerHaptic(ImpactStyle.Light, 10);
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (this.touchStartX === null || this.touchStartY === null) return;
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const dx = this.touchStartX - touchEndX;
    const dy = Math.abs(this.touchStartY - touchEndY);

    const screenWidth = window.innerWidth;
    const isMobile = screenWidth <= 768;
    const isHorizontalSwipe = Math.abs(dx) > 50 && dy < 40;

    // Swipe "siguiente" solo si empieza cerca del borde derecho (final de la pantalla)
    const rightEdgeMin = screenWidth * 0.85;
    const startedInCenter = this.touchStartX >= rightEdgeMin;

    // Swipe "atrás" solo si empieza cerca del borde izquierdo (gesto tipo iOS)
    const leftEdgeMax = screenWidth * 0.15;
    const startedAtLeftEdge = this.touchStartX <= leftEdgeMax;

    if (isMobile && isHorizontalSwipe) {
      if (dx > 0 && startedInCenter) {
        this.goToNextFooterScreen(); // Swipe hacia la izquierda
      } else if (dx < 0 && startedAtLeftEdge) {
        this.goToPrevFooterScreen(); // Swipe hacia la derecha (atrás)
      }
    }
    this.touchStartX = null;
    this.touchStartY = null;
  }


  goToNextFooterScreen() {
    const isDoctor = this.userRole() === 'doctor';
    const doctorTabs = ['/app/home-doctor', '/app/patients', '/app/calendar', '/app/profile'];
    const clientTabs = ['/app/home-client', '/app/search', '/app/appointments', '/app/profile'];
    const tabs = isDoctor ? doctorTabs : clientTabs;
    const currentIndex = tabs.findIndex(tab => this.router.url.startsWith(tab));
    if (currentIndex < tabs.length - 1) {
      // void this.triggerHaptic(ImpactStyle.Medium, 15);
      this.router.navigate([tabs[currentIndex + 1]]);
    }
  }

  goToPrevFooterScreen() {
    const isDoctor = this.userRole() === 'doctor';
    const doctorTabs = ['/app/home-doctor', '/app/patients', '/app/calendar', '/app/profile'];
    const clientTabs = ['/app/home-client', '/app/search', '/app/appointments', '/app/profile'];
    const tabs = isDoctor ? doctorTabs : clientTabs;
    const currentIndex = tabs.findIndex(tab => this.router.url.startsWith(tab));
    if (currentIndex > 0) {
      // void this.triggerHaptic(ImpactStyle.Medium, 15);
      this.router.navigate([tabs[currentIndex - 1]]);
    }
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
