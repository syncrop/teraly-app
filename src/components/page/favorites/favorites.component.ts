import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { FavoritesService } from '../../../services/favorites.service';
import { ToastService } from '../../../services/toast.service';
import { forkJoin } from 'rxjs';

interface FavoriteDoctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  sessions: number;
  image: string;
  languages: string[];
  available: boolean;
  savedForLater?: boolean;
  status?: 'active' | 'scheduled' | 'saved';
}

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class FavoritesComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private favoritesService = inject(FavoritesService);
  private toastService = inject(ToastService);

  activeTab = signal<'favorites' | 'history'>('favorites');
  isLoading = signal(true);
  favoriteDoctors = signal<FavoriteDoctor[]>([]);

  filteredDoctors = computed(() => {
    if (this.activeTab() === 'favorites') {
      return this.favoriteDoctors();
    }
    return [];
  });

  favoritesCount = computed(() => this.favoriteDoctors().length);

  ngOnInit() {
    window.scrollTo(0, 0);
    // Verificar si hay un tab específico en los query params
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'history') {
        this.activeTab.set('history');
      }
    });
    
    this.loadFavorites();
  }

  loadFavorites() {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.toastService.error('Usuario no encontrado');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    // Primero obtener los IDs de los doctores favoritos
    this.favoritesService.getUserFavorites(userId).subscribe({
      next: (doctorIds) => {
        if (doctorIds.length === 0) {
          this.favoriteDoctors.set([]);
          this.isLoading.set(false);
          return;
        }

        // Obtener los datos de cada doctor favorito
        const doctorRequests = doctorIds.map(doctorId => 
          this.userService.getDoctorById(doctorId)
        );

        forkJoin(doctorRequests).subscribe({
          next: (doctors) => {
            const favoriteDoctorsList: FavoriteDoctor[] = doctors
              .filter(doctor => doctor !== null)
              .map(doctor => ({
                id: doctor!.uid,
                name: doctor!.fullName || 'Doctor',
                specialty: doctor!.specialty || 'Psicología',
                rating: doctor!.ratings || 0,
                sessions: doctor!.reviewsCount || 0,
                image: doctor!.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor!.fullName || 'Doctor') + '&background=818cf8&color=fff&size=200',
                languages: doctor!.languages?.map(lang => this.getLanguageFlag(lang)) || ['🇪🇸'],
                available: doctor!.available || false,
                status: 'saved',
                savedForLater: true
              }));

            this.favoriteDoctors.set(favoriteDoctorsList);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error al cargar datos de doctores:', error);
            this.toastService.error('Error al cargar favoritos');
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar favoritos:', error);
        this.toastService.error('Error al cargar favoritos');
        this.isLoading.set(false);
      }
    });
  }

  private getLanguageFlag(langCode: string): string {
    const flags: Record<string, string> = {
      'es': '🇪🇸',
      'en': '🇬🇧',
      'pl': '🇵🇱',
      'uk': '🇺🇦',
      'español': '🇪🇸',
      'english': '🇬🇧',
      'polski': '🇵🇱',
      'українська': '🇺🇦'
    };
    return flags[langCode.toLowerCase()] || '🇪🇸';
  }

  selectTab(tab: 'favorites' | 'history') {
    this.activeTab.set(tab);
  }

  removeFavorite(doctorId: string) {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.toastService.error('Usuario no encontrado');
      return;
    }

    this.favoritesService.removeFavorite(userId, doctorId).subscribe({
      next: (success) => {
        if (success) {
          const updated = this.favoriteDoctors().filter(d => d.id !== doctorId);
          this.favoriteDoctors.set(updated);
          this.toastService.success('Eliminado de favoritos');
        } else {
          this.toastService.error('Error al eliminar de favoritos');
        }
      },
      error: (error) => {
        console.error('Error al eliminar favorito:', error);
        this.toastService.error('Error al eliminar de favoritos');
      }
    });
  }

  viewDoctorDetail(doctorId: string) {
    this.router.navigate(['/app/doctor', doctorId]);
  }

  reserveAgain(doctorId: string) {
    this.router.navigate(['/app/doctor', doctorId]);
  }

  viewAvailability(doctorId: string) {
    this.router.navigate(['/app/doctor', doctorId]);
  }

  scheduleFirstAppointment(doctorId: string) {
    this.router.navigate(['/app/doctor', doctorId]);
  }

  openChat(doctorId: string) {
    // TODO: Implement chat functionality
    console.log('Open chat with doctor:', doctorId);
  }

  goBack() {
    this.location.back();
  }
}
