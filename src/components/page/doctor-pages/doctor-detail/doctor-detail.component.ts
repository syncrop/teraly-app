import { ChangeDetectionStrategy, Component, inject, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../../services/toast.service';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';
import { FavoritesService } from '../../../../services/favorites.service';
import { AppointmentService } from '../../../../services/appointment.service';
import { ReviewService } from '../../../../services/review.service';
import { CurrencySymbolPipe } from '../../../shared/pipes/currency-symbol.pipe';
import { Doctor, AvailableDay } from '../../../../models/doctor.model';
import { DoctorReview } from '../../../../models/review.model';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { DaySchedule, BlockedDate } from '../../../../models/availability.model';

interface AvailableTimeSlot {
  time: string;
  available: boolean;
}

type WeekdayKey = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

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
  private appointmentService = inject(AppointmentService);
  private reviewService = inject(ReviewService);
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
  availableDays = signal<AvailableDay[]>([]);

  // Time slots for selected day with availability status
  timeSlots = signal<AvailableTimeSlot[]>([]);
  isLoadingSlots = signal(false);

  // Reviews
  reviews = signal<DoctorReview[]>([]);
  isLoadingReviews = signal(false);
  myReview = signal<DoctorReview | null>(null);
  canCreateReview = signal(false);
  completedAppointmentIdForReview = signal<string | null>(null);

  reviewRating = signal<number>(5);
  reviewComment = signal<string>('');
  isSubmittingReview = signal(false);

  // Doctor data from backend
  doctor = signal<Doctor | null>(null);

  // Verificar si es el propio perfil del doctor
  isOwnProfile = signal(false);

  // Store doctor's availability configuration
  private doctorAvailability: DaySchedule[] = [];
  private doctorSessionDuration = 60;
  private doctorBreakTime = 15;
  private blockedDates: BlockedDate[] = [];

  private readonly weekdayKeys: readonly WeekdayKey[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

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

        // Reviews
        this.loadReviews(id);
        this.refreshReviewEligibility(id);
        
        // Solo verificar favoritos si NO es el propio perfil
        if (!this.isOwnProfile()) {
          this.checkIfFavorite(id);
        }
      }
    });
  }

  private loadReviews(doctorId: string) {
    this.isLoadingReviews.set(true);
    this.reviewService.getDoctorReviews(doctorId).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.isLoadingReviews.set(false);
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.isLoadingReviews.set(false);
      }
    });
  }

  private refreshReviewEligibility(doctorId: string) {
    const user = this.authService.currentUser();
    const userId = this.currentUserId();

    if (!userId || !user || user.role !== 'client') {
      this.canCreateReview.set(false);
      this.myReview.set(null);
      this.completedAppointmentIdForReview.set(null);
      return;
    }

    // 1) Check if user already reviewed this doctor
    this.reviewService.getReviewForDoctor(doctorId, userId).subscribe({
      next: (existing) => {
        this.myReview.set(existing);
        if (existing) {
          this.canCreateReview.set(false);
          this.completedAppointmentIdForReview.set(null);
          return;
        }

        // 2) Find a completed appointment for this doctor
        this.appointmentService.getClientAppointments(userId).subscribe({
          next: (appointments) => {
            const completed = (appointments ?? [])
              .filter(a => a.doctorId === doctorId && a.status === 'completed' && !!a.id)
              .sort((a, b) => {
                const dateCompare = (b.date ?? '').localeCompare(a.date ?? '');
                if (dateCompare !== 0) return dateCompare;
                return (b.startTime ?? '').localeCompare(a.startTime ?? '');
              });

            const apt = completed[0];
            if (apt?.id) {
              this.completedAppointmentIdForReview.set(apt.id);
              this.canCreateReview.set(true);
            } else {
              this.completedAppointmentIdForReview.set(null);
              this.canCreateReview.set(false);
            }
          },
          error: () => {
            this.completedAppointmentIdForReview.set(null);
            this.canCreateReview.set(false);
          }
        });
      },
      error: () => {
        this.canCreateReview.set(false);
        this.myReview.set(null);
        this.completedAppointmentIdForReview.set(null);
      }
    });
  }

  submitReview() {
    const doctorId = this.doctorId();
    const user = this.authService.currentUser();
    const userId = this.currentUserId();
    const appointmentId = this.completedAppointmentIdForReview();

    if (!doctorId || !userId || !user || user.role !== 'client') {
      this.toastService.error('Debes iniciar sesión como paciente para dejar una reseña');
      return;
    }

    if (!appointmentId) {
      this.toastService.error('Necesitas haber completado una cita para dejar una reseña');
      return;
    }

    const rating = this.reviewRating();
    const comment = this.reviewComment().trim();
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      this.toastService.error('Selecciona una calificación válida (1-5)');
      return;
    }
    if (!comment) {
      this.toastService.error('Escribe un comentario');
      return;
    }

    this.isSubmittingReview.set(true);
    this.reviewService.createReview({
      doctorId,
      clientId: userId,
      appointmentId,
      rating,
      comment,
      clientName: user.fullName || user.email || 'Usuario',
      clientAvatar: user.photoURL ?? null,
    }).subscribe({
      next: (ok) => {
        this.isSubmittingReview.set(false);
        if (ok) {
          this.toastService.success('¡Reseña enviada!');
          this.reviewComment.set('');
          this.reviewRating.set(5);
          this.loadReviews(doctorId);
          this.refreshReviewEligibility(doctorId);
        } else {
          this.toastService.error('No se pudo enviar la reseña');
        }
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.isSubmittingReview.set(false);
        this.toastService.error('Error al enviar la reseña');
      }
    });
  }

  setReviewRating(rating: number) {
    this.reviewRating.set(rating);
  }

  onReviewCommentInput(value: string) {
    this.reviewComment.set(value);
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

          // Load doctor availability (prefer data already fetched by UserService, fallback to Firestore getDoc)
          const appliedFromDoctorData = this.applyAvailabilityFromDoctorData(doctorData);
          if (!appliedFromDoctorData) {
            this.loadDoctorAvailability(doctorId);
          }
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
        const availability = this.parseDayScheduleList(data['availability']);
        const blockedDates = this.parseBlockedDateList(data['blockedDates']);
        const sessionDuration = this.parseNumberValue(data['sessionDuration']) ?? 60;
        const breakTime = this.parseNumberValue(data['breakTime']) ?? 15;

        this.applyAvailabilityConfig(availability, blockedDates, sessionDuration, breakTime);
      }
    } catch (error) {
      console.error('Error al cargar disponibilidad del doctor:', error);
    }
  }

  private applyAvailabilityFromDoctorData(doctorData: any): boolean {
    const source = doctorData?.fields ? doctorData.fields : doctorData;

    const availability = this.parseDayScheduleList(source?.availability);
    const blockedDates = this.parseBlockedDateList(source?.blockedDates);
    const sessionDuration = this.parseNumberValue(source?.sessionDuration) ?? 60;
    const breakTime = this.parseNumberValue(source?.breakTime) ?? 15;

    if (
      availability.length === 0 &&
      blockedDates.length === 0 &&
      source?.sessionDuration == null &&
      source?.breakTime == null
    ) {
      return false;
    }

    this.applyAvailabilityConfig(availability, blockedDates, sessionDuration, breakTime);
    return true;
  }

  private applyAvailabilityConfig(
    availability: DaySchedule[],
    blockedDates: BlockedDate[],
    sessionDuration: number,
    breakTime: number,
  ) {
    this.doctorAvailability = availability;
    this.doctorSessionDuration = sessionDuration;
    this.doctorBreakTime = breakTime;
    this.blockedDates = blockedDates;

    const generatedDays = this.generateAvailableDays(availability, blockedDates);
    this.availableDays.set(generatedDays);

    const firstAvailableDay = generatedDays.find(d => d.available);
    if (firstAvailableDay) {
      this.selectedDay.set(firstAvailableDay.date);
      this.calculateTimeSlotsWithAvailability(firstAvailableDay.date);
    }
  }

  private parseDayScheduleList(raw: unknown): DaySchedule[] {
    if (Array.isArray(raw)) {
      // Native REST conversion returns arrays with mapValue wrappers for complex objects.
      const looksLikeTypedMaps = raw.some((v: any) => v?.mapValue?.fields);
      if (looksLikeTypedMaps) {
        return (raw as any[])
          .map((v: any): DaySchedule | null => {
            const fields = v?.mapValue?.fields;
            if (!fields) return null;

            const day = this.parseStringValue(fields.day) ?? '';
            const enabled = this.parseBooleanValue(fields.enabled) ?? false;
            const isExpanded = this.parseBooleanValue(fields.isExpanded) ?? false;
            const dayName = this.parseStringValue(fields.dayName) ?? '';

            const slotsRaw = fields.slots;
            const slotsValues = slotsRaw?.arrayValue?.values;
            const slots = Array.isArray(slotsValues)
              ? slotsValues
                  .map((sv: any): { start: string; end: string } | null => {
                    const slotFields = sv?.mapValue?.fields;
                    if (!slotFields) return null;
                    const start = this.parseStringValue(slotFields.start) ?? '';
                    const end = this.parseStringValue(slotFields.end) ?? '';
                    if (!start || !end) return null;
                    return { start, end };
                  })
                  .filter(Boolean) as { start: string; end: string }[]
              : [];

            if (!day) return null;

            return {
              day,
              dayName,
              enabled,
              slots,
              isExpanded,
            };
          })
          .filter(Boolean) as DaySchedule[];
      }

      // Already a plain DaySchedule[]
      return raw as DaySchedule[];
    }

    const values = (raw as any)?.arrayValue?.values;
    if (!Array.isArray(values)) return [];

    return values
      .map((v: any): DaySchedule | null => {
        const fields = v?.mapValue?.fields;
        if (!fields) return null;

        const day = this.parseStringValue(fields.day) ?? '';
        const enabled = this.parseBooleanValue(fields.enabled) ?? false;
        const isExpanded = this.parseBooleanValue(fields.isExpanded) ?? false;
        const slotsRaw = fields.slots;
        const slotsValues = slotsRaw?.arrayValue?.values;
        const slots = Array.isArray(slotsValues)
          ? slotsValues
              .map((sv: any): { start: string; end: string } | null => {
                const slotFields = sv?.mapValue?.fields;
                if (!slotFields) return null;
                const start = this.parseStringValue(slotFields.start) ?? '';
                const end = this.parseStringValue(slotFields.end) ?? '';
                if (!start || !end) return null;
                return { start, end };
              })
              .filter(Boolean) as { start: string; end: string }[]
          : [];

        if (!day) return null;

        return {
          day,
          dayName: '',
          enabled,
          slots,
          isExpanded,
        };
      })
      .filter(Boolean) as DaySchedule[];
  }

  private parseBlockedDateList(raw: unknown): BlockedDate[] {
    if (Array.isArray(raw)) return raw as BlockedDate[];

    const values = (raw as any)?.arrayValue?.values;
    if (!Array.isArray(values)) return [];

    return values
      .map((v: any): BlockedDate | null => {
        const fields = v?.mapValue?.fields;
        if (!fields) return null;
        const startDate = this.parseStringValue(fields.startDate) ?? '';
        const endDate = this.parseStringValue(fields.endDate) ?? '';
        const reason = this.parseStringValue(fields.reason) ?? '';
        const dateRange = this.parseStringValue(fields.dateRange) ?? '';
        if (!startDate || !endDate) return null;
        return { startDate, endDate, reason, dateRange };
      })
      .filter(Boolean) as BlockedDate[];
  }

  private parseStringValue(v: any): string | null {
    if (typeof v === 'string') return v;
    if (v?.stringValue != null) return String(v.stringValue);
    return null;
  }

  private parseBooleanValue(v: any): boolean | null {
    if (typeof v === 'boolean') return v;
    if (v?.booleanValue != null) return Boolean(v.booleanValue);
    return null;
  }

  private parseNumberValue(v: any): number | null {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
    if (v?.stringValue != null && String(v.stringValue).trim() !== '' && Number.isFinite(Number(v.stringValue))) {
      return Number(v.stringValue);
    }
    if (v?.integerValue != null && Number.isFinite(Number(v.integerValue))) return Number(v.integerValue);
    if (v?.doubleValue != null && Number.isFinite(Number(v.doubleValue))) return Number(v.doubleValue);
    return null;
  }

  generateAvailableDays(availability: DaySchedule[], blockedDates: BlockedDate[]): AvailableDay[] {
    const days: AvailableDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      const dayKey = this.weekdayKeys[dayOfWeek];
      const dayName =
        i === 0
          ? $localize`:@@calendar.today:Hoy`
          : i === 1
            ? $localize`:@@calendar.tomorrow:Mañana`
            : this.getCalendarDayAbbreviation(dayKey);
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

  private getCalendarDayAbbreviation(dayKey: WeekdayKey): string {
    switch (dayKey) {
      case 'monday':
        return $localize`:@@calendar.weekday.monday:lunes`;
      case 'tuesday':
        return $localize`:@@calendar.weekday.tuesday:martes`;
      case 'wednesday':
        return $localize`:@@calendar.weekday.wednesday:miércoles`;
      case 'thursday':
        return $localize`:@@calendar.weekday.thursday:jueves`;
      case 'friday':
        return $localize`:@@calendar.weekday.friday:viernes`;
      case 'saturday':
        return $localize`:@@calendar.weekday.saturday:sábado`;
      case 'sunday':
        return $localize`:@@calendar.weekday.sunday:domingo`;
    }
  }

  isDateBlocked(date: string, blockedDates: BlockedDate[]): boolean {
    const checkDate = new Date(date);
    
    return blockedDates.some(blocked => {
      const startDate = new Date(blocked.startDate);
      const endDate = new Date(blocked.endDate);
      return checkDate >= startDate && checkDate <= endDate;
    });
  }

  calculateTimeSlotsWithAvailability(selectedDate: string) {
    this.isLoadingSlots.set(true);
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[dayOfWeek];
    
    const daySchedule = this.doctorAvailability.find(d => d.day === dayKey);
    if (!daySchedule || !daySchedule.enabled || daySchedule.slots.length === 0) {
      this.timeSlots.set([]);
      this.isLoadingSlots.set(false);
      return;
    }
    
    const slots: AvailableTimeSlot[] = [];
    const sessionDuration = +this.doctorSessionDuration;
    const breakTime = this.doctorBreakTime;
    
    // Verificar si es hoy para filtrar por hora actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);
    const isToday = selectedDay.getTime() === today.getTime();
    
    // Obtener hora actual en minutos
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    
    // For each time range in the day
    daySchedule.slots.forEach(range => {
      const [startHour, startMinute] = range.start.split(':').map(Number);
      const [endHour, endMinute] = range.end.split(':').map(Number);
      
      let currentTime = startHour * 60 + startMinute;
      let endTime = endHour * 60 + endMinute;

      // Handle ranges that end at 00:00 or otherwise wrap past midnight
      if (endTime <= currentTime) {
        endTime += 24 * 60;
      }
      
      while (currentTime + sessionDuration <= endTime) {
        // Si es hoy, solo mostrar slots futuros
        if (!isToday || currentTime > currentTimeInMinutes) {
          const hour = Math.floor(currentTime / 60);
          const minute = currentTime % 60;
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Solo agregar si no existe ya
          if (!slots.some(s => s.time === time)) {
            slots.push({ time, available: true });
          }
        }
        
        currentTime += sessionDuration + breakTime;
      }
    });
    
    // Ordenar slots por hora
    slots.sort((a, b) => {
      const [aHour, aMin] = a.time.split(':').map(Number);
      const [bHour, bMin] = b.time.split(':').map(Number);
      return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });
    
    // Verificar disponibilidad real contra citas existentes
    this.checkSlotsAvailability(slots, selectedDate);
  }

  checkSlotsAvailability(slots: AvailableTimeSlot[], date: string) {
    const doctorId = this.doctorId();
    if (!doctorId) {
      this.timeSlots.set(slots);
      this.isLoadingSlots.set(false);
      return;
    }

    // Cargar citas existentes del día
    this.appointmentService.getDoctorAppointmentsByDateRange(doctorId, date, date).subscribe({
      next: (appointments) => {
        // Marcar slots ocupados
        const updatedSlots = slots.map(slot => {
          const hasConflict = appointments.some(apt => {
            if (apt.status === 'cancelled') return false;
            return apt.startTime === slot.time;
          });
          return { ...slot, available: !hasConflict };
        });
        
        this.timeSlots.set(updatedSlots);
        this.isLoadingSlots.set(false);
      },
      error: (error) => {
        console.error('Error al cargar citas existentes:', error);
        // Si hay error, mostrar todos los slots como disponibles
        this.timeSlots.set(slots);
        this.isLoadingSlots.set(false);
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
      this.toastService.error('Por favor, selecciona un día y una hora para tu cita');
      return;
    }

    const clientId = this.currentUserId();
    const doctorData = this.doctor();
    const selectedDate = this.selectedDay();
    const selectedTime = this.selectedTimeSlot();

    if (!clientId) {
      this.toastService.error('Debes iniciar sesión para reservar una cita');
      this.router.navigate(['/login']);
      return;
    }

    // Get current user data from service
    this.authService.getCurrentUser().subscribe({
      next: (currentUser) => {
        if (!currentUser) {
          this.toastService.error('Debes iniciar sesión para reservar una cita');
          this.router.navigate(['/login']);
          return;
        }

        if (currentUser.role !== 'client') {
          this.toastService.error('Solo los pacientes pueden reservar citas');
          return;
        }

        if (!doctorData || !selectedDate || !selectedTime) {
          this.toastService.error('Información incompleta para crear la cita');
          return;
        }

        // Calculate end time based on session duration
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + this.doctorSessionDuration;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

        // Verify slot is still available before creating
        this.appointmentService.isTimeSlotAvailable(
          this.doctorId(),
          selectedDate,
          selectedTime,
          endTime
        ).subscribe({
          next: (isAvailable) => {
            if (!isAvailable) {
              this.toastService.error('Este horario ya no está disponible. Por favor, selecciona otro.');
              // Refresh time slots
              this.calculateTimeSlotsWithAvailability(selectedDate);
              return;
            }

            // Create appointment
            const appointment = {
              doctorId: this.doctorId(),
              doctorName: doctorData.name,
              clientId: clientId,
              clientName: currentUser.fullName || currentUser.email || 'Cliente',
              date: selectedDate,
              startTime: selectedTime,
              endTime: endTime,
              duration: this.doctorSessionDuration,
              type: 'video' as const, // Default to video
              status: 'pending' as const,
              reason: 'Consulta general', // Default reason
              notes: '',
              price: doctorData.price,
              currency: doctorData.currency
            };

            this.toastService.info('Creando tu cita...');

            this.appointmentService.createAppointment(appointment).subscribe({
              next: (appointmentId) => {
                if (appointmentId) {
                  this.toastService.success('¡Cita reservada exitosamente!');
                  // Reset selections
                  this.selectedDay.set(null);
                  this.selectedTimeSlot.set(null);
                  // Navigate to appointments page
                  this.router.navigate(['/app/appointments']);
                } else {
                  this.toastService.error('Error al crear la cita. Intenta nuevamente.');
                }
              },
              error: (error) => {
                console.error('Error creating appointment:', error);
                this.toastService.error('Error al crear la cita. Intenta nuevamente.');
              }
            });
          },
          error: (error) => {
            console.error('Error checking availability:', error);
            this.toastService.error('Error al verificar disponibilidad. Intenta nuevamente.');
          }
        });
      },
      error: (error) => {
        console.error('Error getting current user:', error);
        this.toastService.error('Error al verificar autenticación. Intenta nuevamente.');
      }
    });
  }

  sendMessage() {
    // TODO: Open chat/message
    console.log('Send message to:', this.doctor().name);
  }

  selectDay(date: string) {
    this.selectedDay.set(date);
    this.selectedTimeSlot.set(null); // Reset selected time slot
    // Recalculate time slots for the newly selected day
    this.calculateTimeSlotsWithAvailability(date);
  }

  selectTimeSlot(slot: string) {
    this.selectedTimeSlot.set(slot);
  }

  canBook(): boolean {
    return !!(this.selectedDay() && this.selectedTimeSlot() && !this.isOwnProfile());
  }

  navigateToEditProfile() {
    this.router.navigate(['/app/edit-doctor-profile']);
  }
}
