import { ChangeDetectionStrategy, Component, inject, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { FavoritesService } from '../../../services/favorites.service';
import { CurrencySymbolPipe } from '../../shared/pipes/currency-symbol.pipe';
import { Doctor, AvailableDay, Review } from '../../../models/doctor.model';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule, CurrencySymbolPipe],
  templateUrl: './doctor-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private location = inject(Location);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private favoritesService = inject(FavoritesService);

  @ViewChild('availabilitySection') availabilitySection?: ElementRef;

  isLoading = signal(true);
  isFavorite = signal(false);
  showFullDescription = signal(false);
  selectedDay = signal<string | null>(null);
  selectedTimeSlot = signal<string | null>(null);
  doctorId = signal<string>('');
  currentUserId = signal<string>('');

  // Available days
  availableDays = signal<AvailableDay[]>([
    { date: '24', dayName: 'Hoy', dayNumber: '24', available: true },
    { date: '25', dayName: 'Mie', dayNumber: '25', available: false },
    { date: '26', dayName: 'Jue', dayNumber: '26', available: true },
    { date: '27', dayName: 'Vie', dayNumber: '27', available: false }
  ]);

  // Time slots for selected day
  timeSlots = signal<string[]>(['16:30', '17:30', '19:00']);

  // Reviews
  reviews = signal<Review[]>([
    {
      id: 1,
      name: 'Marta G.',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      rating: 5,
      comment: 'El Dr. Javier me ayudó muchísimo con mi ansiedad social. Desde la segunda sesión noté cambios...'
    }
  ]);

  // Doctor data from backend
  doctor = signal<Doctor | null>(null);

  ngOnInit() {
    // Get current user ID
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.currentUserId.set(userId);
    }

    // Get doctor ID from URL
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.doctorId.set(id);
        this.loadDoctorData(id);
        this.checkIfFavorite(id);
      }
    });
  }

  checkIfFavorite(doctorId: string) {
    const userId = this.currentUserId();
    if (userId) {
      this.favoritesService.isFavorite(userId, doctorId).subscribe({
        next: (isFav) => {
          this.isFavorite.set(isFav);
        },
        error: (error) => {
          console.error('Error al verificar favorito:', error);
        }
      });
    }
  }

  loadDoctorData(doctorId: string) {
    this.isLoading.set(true);
    this.userService.getDoctorById(doctorId).subscribe({
      next: (doctorData) => {
        if (doctorData) {
          this.doctor.set({
            id: parseInt(doctorData.uid) || 0,
            name: doctorData.fullName || 'Doctor',
            specialty: doctorData.specialty || 'Psicología',
            specialties: doctorData.specialties || [],
            description: doctorData.description || 'Sin descripción disponible',
            rating: doctorData.ratings || 0,
            patients: doctorData.reviewsCount ? `${doctorData.reviewsCount}+` : '0',
            experience: doctorData.experience ? `${doctorData.experience} años` : 'N/A',
            price: doctorData.price || 50,
            currency: doctorData.currency || 'EUR',
            image: doctorData.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctorData.fullName || 'Doctor') + '&background=818cf8&color=fff&size=200',
            languages: doctorData.languages?.map(lang => this.getLanguageFlag(lang)) || ['🇪🇸'],
            verified: doctorData.isVerified || false
          });
        } else {
          this.toastService.error('Doctor no encontrado');
          this.goBack();
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar datos del doctor:', error);
        this.toastService.error('Error al cargar datos del doctor');
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

  goBack() {
    this.location.back();
  }

  toggleFavorite() {
    debugger;
    const userId = this.currentUserId();
    const doctorId = this.doctorId();

    if (!userId) {
      this.toastService.error('Debes iniciar sesión para agregar favoritos');
      return;
    }

    if (!doctorId) {
      this.toastService.error('Doctor no encontrado');
      return;
    }

    const currentFavoriteState = this.isFavorite();

    if (currentFavoriteState) {
      // Remove from favorites
      this.favoritesService.removeFavorite(userId, doctorId).subscribe({
        next: (success) => {
          if (success) {
            this.isFavorite.set(false);
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
    } else {
      // Add to favorites
      this.favoritesService.addFavorite(userId, doctorId).subscribe({
        next: (success) => {
          if (success) {
            this.isFavorite.set(true);
            this.toastService.success('Agregado a favoritos');
          } else {
            this.toastService.error('Error al agregar a favoritos');
          }
        },
        error: (error) => {
          console.error('Error al agregar favorito:', error);
          this.toastService.error('Error al agregar a favoritos');
        }
      });
    }
  }

  toggleDescription() {
    this.showFullDescription.update(val => !val);
  }

  bookAppointment() {
    // Validate that day and time are selected
    if (!this.selectedDay() || !this.selectedTimeSlot()) {
      // Scroll to availability section
      if (this.availabilitySection) {
        this.availabilitySection.nativeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      // Show error toast
      this.toastService.show(
        'Por favor, selecciona un día y una hora para tu cita',
        'error'
      );
      return;
    }
    
    // TODO: Navigate to booking confirmation page
    console.log('Book appointment with:', this.doctor().name, 'on', this.selectedDay(), 'at', this.selectedTimeSlot());
    this.toastService.show(
      'Procesando tu reserva...',
      'info'
    );
  }

  sendMessage() {
    // TODO: Open chat/message
    console.log('Send message to:', this.doctor().name);
  }

  selectDay(date: string) {
    this.selectedDay.set(date);
    // TODO: Load time slots for selected day
  }

  selectTimeSlot(slot: string) {
    this.selectedTimeSlot.set(slot);
  }
}
