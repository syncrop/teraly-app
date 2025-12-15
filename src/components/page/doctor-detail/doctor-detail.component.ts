import { ChangeDetectionStrategy, Component, inject, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { FavoritesService } from '../../../services/favorites.service';
import { CurrencySymbolPipe } from '../../shared/pipes/currency-symbol.pipe';
import { Doctor, AvailableDay, Review } from '../../../models/doctor.model';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { TimeSlot, DaySchedule, BlockedDate } from '../../../models/availability.model';

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
  private firestore = inject(Firestore);

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

  // Verificar si es el propio perfil del doctor
  isOwnProfile = signal(false);

  // Store doctor's availability configuration
  private doctorAvailability: DaySchedule[] = [];
  private doctorSessionDuration = 60;
  private doctorBreakTime = 15;

  ngOnInit() {
    window.scrollTo(0, 0);
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
        
        // Verificar si es el propio perfil
        const currentUser = this.authService.currentUser();
        const isDoctor = currentUser?.role === 'doctor';
        const isSameUser = userId === id;
        this.isOwnProfile.set(isDoctor && isSameUser);
        
        this.loadDoctorData(id);
        
        // Solo verificar favoritos si NO es el propio perfil
        if (!this.isOwnProfile()) {
          this.checkIfFavorite(id);
        }
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

          // Load doctor availability
          this.loadDoctorAvailability(doctorId);
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

  async loadDoctorAvailability(doctorId: string) {
    try {
      const doctorRef = doc(this.firestore, 'users', doctorId);
      const doctorDoc = await getDoc(doctorRef);
      
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        const availability = data['availability'] as DaySchedule[] || [];
        const blockedDates = data['blockedDates'] as BlockedDate[] || [];
        const sessionDuration = data['sessionDuration'] || 60;
        const breakTime = data['breakTime'] || 15;
        
        // Store configuration for later use
        this.doctorAvailability = availability;
        this.doctorSessionDuration = sessionDuration;
        this.doctorBreakTime = breakTime;
        
        // Generate available days for next 14 days
        const generatedDays = this.generateAvailableDays(availability, blockedDates);
        this.availableDays.set(generatedDays);
        
        // If there's at least one available day, select it and calculate time slots
        if (generatedDays.length > 0) {
          const firstAvailableDay = generatedDays.find(d => d.available);
          if (firstAvailableDay) {
            this.selectedDay.set(firstAvailableDay.date);
            this.calculateTimeSlots(firstAvailableDay.date, availability, sessionDuration, breakTime);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar disponibilidad del doctor:', error);
    }
  }

  generateAvailableDays(availability: DaySchedule[], blockedDates: BlockedDate[]): AvailableDay[] {
    const days: AvailableDay[] = [];
    const today = new Date();
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const dayKey = dayKeys[dayOfWeek];
      const dayName = i === 0 ? 'Hoy' : (i === 1 ? 'Mañana' : dayNames[dayOfWeek]);
      const dateString = date.toISOString().split('T')[0];
      const dayNumber = date.getDate().toString();
      
      // Check if day is enabled in schedule
      const daySchedule = availability.find(d => d.day === dayKey);
      const isDayEnabled = daySchedule && daySchedule.enabled && daySchedule.slots.length > 0;
      
      // Check if date is blocked
      const isBlocked = this.isDateBlocked(dateString, blockedDates);
      
      days.push({
        date: dateString,
        dayName: dayName,
        dayNumber: dayNumber,
        available: isDayEnabled && !isBlocked
      });
    }
    
    return days;
  }

  isDateBlocked(date: string, blockedDates: BlockedDate[]): boolean {
    const checkDate = new Date(date);
    
    return blockedDates.some(blocked => {
      const startDate = new Date(blocked.startDate);
      const endDate = new Date(blocked.endDate);
      return checkDate >= startDate && checkDate <= endDate;
    });
  }

  calculateTimeSlots(selectedDate: string, availability: DaySchedule[], sessionDuration: number, breakTime: number) {
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[dayOfWeek];
    
    const daySchedule = availability.find(d => d.day === dayKey);
    if (!daySchedule || !daySchedule.enabled || daySchedule.slots.length === 0) {
      this.timeSlots.set([]);
      return;
    }
    
    const slots: string[] = [];
    
    // For each time range in the day
    daySchedule.slots.forEach(range => {
      const [startHour, startMinute] = range.start.split(':').map(Number);
      const [endHour, endMinute] = range.end.split(':').map(Number);
      
      let currentTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      while (currentTime + sessionDuration <= endTime) {
        const hour = Math.floor(currentTime / 60);
        const minute = currentTime % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
        
        currentTime += sessionDuration + breakTime;
      }
    });
    
    this.timeSlots.set(slots);
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
    this.selectedTimeSlot.set(null); // Reset selected time slot
    // Recalculate time slots for the newly selected day
    this.calculateTimeSlots(date, this.doctorAvailability, this.doctorSessionDuration, this.doctorBreakTime);
  }

  selectTimeSlot(slot: string) {
    this.selectedTimeSlot.set(slot);
  }

  navigateToEditProfile() {
    this.router.navigate(['/app/edit-doctor-profile']);
  }
}
