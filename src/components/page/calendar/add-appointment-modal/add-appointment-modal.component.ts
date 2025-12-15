import { Component, inject, signal, computed, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../../services/appointment.service';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { Appointment } from '../../../../models/appointment.model';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { DaySchedule, BlockedDate } from '../../../../models/availability.model';

interface TimeSlot {
  time: string;
  available: boolean;
}

@Component({
  selector: 'app-add-appointment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-appointment-modal.component.html',
})
export class AddAppointmentModalComponent {
  private appointmentService = inject(AppointmentService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private firestore = inject(Firestore);

  // Inputs y Outputs
  selectedDate = input<Date>(new Date());
  close = output<void>();
  appointmentCreated = output<void>();

  // Estado del formulario
  clientSearchQuery = signal('');
  selectedClient = signal<any>(null);
  selectedDate_internal = signal<Date>(new Date());
  selectedTime = signal('09:00');
  duration = signal(60);
  appointmentType = signal<'video' | 'audio' | 'chat'>('video');
  reason = signal('');
  notes = signal('');
  price = signal(50);
  currency = signal('EUR');
  
  // Estados de UI
  isSearching = signal(false);
  isSaving = signal(false);
  searchResults = signal<any[]>([]);
  showClientSearch = signal(true);
  availableTimeSlots = signal<TimeSlot[]>([]);
  isLoadingSlots = signal(false);

  // Configuración de disponibilidad del doctor
  private doctorAvailability: DaySchedule[] = [];
  private doctorSessionDuration = 60;
  private doctorBreakTime = 15;
  private blockedDates: BlockedDate[] = [];

  // Computed
  isFormValid = computed(() => {
    return (
      this.selectedClient() !== null &&
      this.selectedTime() !== '' &&
      this.duration() > 0 &&
      this.reason().trim() !== ''
    );
  });

  dateComponents = computed(() => {
    const date = this.selectedDate() || new Date();
    return {
      day: date.getDate(),
      month: date.getMonth(),
      weekday: date.getDay(),
      year: date.getFullYear()
    };
  });

  ngOnInit() {
    // Inicializar fecha
    const inputDate = this.selectedDate();
    if (inputDate) {
      this.selectedDate_internal.set(inputDate);
    }

    // Cargar datos del doctor para precio y moneda
    // La carga de disponibilidad generará los slots automáticamente
    this.loadDoctorData();
  }

  loadDoctorData() {
    const doctorId = this.authService.getCurrentUserId();
    if (doctorId) {
      this.userService.getDoctorById(doctorId).subscribe({
        next: (doctor) => {
          if (doctor) {
            this.price.set(doctor.price || 50);
            this.currency.set(doctor.currency || 'EUR');
          }
        }
      });

      // Cargar configuración de disponibilidad
      this.loadDoctorAvailability(doctorId);
    }
  }

  async loadDoctorAvailability(doctorId: string) {
    try {
      const doctorRef = doc(this.firestore, 'users', doctorId);
      const doctorDoc = await getDoc(doctorRef);
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        this.doctorAvailability = data['availability'] as DaySchedule[] || [];
        this.doctorSessionDuration = data['sessionDuration'] || 60;
        this.doctorBreakTime = data['breakTime'] || 15;
        this.blockedDates = data['blockedDates'] as BlockedDate[] || [];
        
        // Actualizar duración por defecto
        this.duration.set(this.doctorSessionDuration);
        
        // Generar slots basados en la disponibilidad
        this.generateAvailableSlots();
      }
    } catch (error) {
      console.error('Error al cargar disponibilidad del doctor:', error);
      this.generateAvailableSlots(); // Generar slots por defecto
    }
  }

  generateAvailableSlots() {
    this.isLoadingSlots.set(true);
    
    const selectedDate = this.selectedDate_internal();
    const dateStr = this.formatDate(selectedDate);
    
    // Verificar si el día está bloqueado
    if (this.isDateBlocked(dateStr)) {
      this.toastService.info('Esta fecha está bloqueada (vacaciones o día festivo)');
      this.availableTimeSlots.set([]);
      this.isLoadingSlots.set(false);
      return;
    }
    
    // Obtener día de la semana
    const dayOfWeek = selectedDate.getDay();
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[dayOfWeek];
    
    // Buscar configuración del día
    const daySchedule = this.doctorAvailability.find(d => d.day === dayKey);
    
    if (!daySchedule || !daySchedule.enabled || daySchedule.slots.length === 0) {
      this.toastService.info('No hay horarios configurados para este día');
      this.availableTimeSlots.set([]);
      this.isLoadingSlots.set(false);
      return;
    }
    
    const slots: TimeSlot[] = [];
    const sessionDuration = +this.doctorSessionDuration;
    const breakTime = this.doctorBreakTime;
    
    // Generar slots basados en los rangos horarios del día
    daySchedule.slots.forEach(range => {
      const [startHour, startMinute] = range.start.split(':').map(Number);
      const [endHour, endMinute] = range.end.split(':').map(Number);
      
      let currentTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      while (currentTime + sessionDuration <= endTime) {
        const hour = Math.floor(currentTime / 60);
        const minute = currentTime % 60;
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        slots.push({ time, available: true });
        currentTime += sessionDuration + breakTime;
      }
    });
    
    // Verificar disponibilidad real contra citas existentes
    this.checkSlotsAvailability(slots);
  }

  isDateBlocked(date: string): boolean {
    const checkDate = new Date(date);
    
    return this.blockedDates.some(blocked => {
      const startDate = new Date(blocked.startDate);
      const endDate = new Date(blocked.endDate);
      return checkDate >= startDate && checkDate <= endDate;
    });
  }

  checkSlotsAvailability(slots: TimeSlot[]) {
    const doctorId = this.authService.getCurrentUserId();
    if (!doctorId) {
      this.availableTimeSlots.set(slots);
      this.isLoadingSlots.set(false);
      return;
    }

    const dateStr = this.formatDate(this.selectedDate_internal());
    
    // Cargar citas existentes del día
    this.appointmentService.getDoctorAppointmentsByDateRange(doctorId, dateStr, dateStr).subscribe({
      next: (appointments) => {
        // Marcar slots ocupados
        const updatedSlots = slots.map(slot => {
          const hasConflict = appointments.some(apt => {
            if (apt.status === 'cancelled') return false;
            return apt.startTime === slot.time;
          });
          return { ...slot, available: !hasConflict };
        });
        
        this.availableTimeSlots.set(updatedSlots);
        this.isLoadingSlots.set(false);
      },
      error: (error) => {
        console.error('Error al cargar citas existentes:', error);
        // Si hay error, mostrar todos los slots de disponibilidad del doctor como disponibles
        this.availableTimeSlots.set(slots);
        this.isLoadingSlots.set(false);
      }
    });
  }

  searchClients() {
    const query = this.clientSearchQuery().trim();
    if (query.length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    this.userService.getClients().subscribe({
      next: (clients) => {
        const filtered = clients.filter(client => 
          client.fullName?.toLowerCase().includes(query.toLowerCase()) ||
          client.email?.toLowerCase().includes(query.toLowerCase())
        );
        this.searchResults.set(filtered);
        this.isSearching.set(false);
      },
      error: () => {
        this.isSearching.set(false);
        this.searchResults.set([]);
      }
    });
  }

  selectClient(client: any) {
    this.selectedClient.set(client);
    this.showClientSearch.set(false);
    this.clientSearchQuery.set('');
    this.searchResults.set([]);
  }

  clearClientSelection() {
    this.selectedClient.set(null);
    this.showClientSearch.set(true);
  }

  selectTimeSlot(time: string) {
    this.selectedTime.set(time);
  }

  calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async saveAppointment() {
    debugger;
    if (!this.isFormValid()) {
      this.toastService.error('Por favor completa todos los campos requeridos');
      return;
    }

    const client = this.selectedClient();
    const doctorId = this.authService.getCurrentUserId();
    
    if (!client || !doctorId) return;

    this.isSaving.set(true);

    const startTime = this.selectedTime();
    const endTime = this.calculateEndTime(startTime, this.duration());
    const dateStr = this.formatDate(this.selectedDate_internal());

    // Verificar disponibilidad una última vez
    const isAvailable = await this.appointmentService.isTimeSlotAvailable(
      doctorId,
      dateStr,
      startTime,
      endTime
    ).toPromise();

    if (!isAvailable) {
      this.toastService.error('Este horario ya no está disponible');
      this.isSaving.set(false);
      this.generateAvailableSlots(); // Refrescar slots
      return;
    }

    const appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
      doctorId,
      clientId: client.uid,
      clientName: client.fullName || 'Cliente',
      clientPhoto: client.photoURL,
      date: dateStr,
      startTime,
      endTime,
      duration: this.duration(),
      status: 'confirmed', // Citas creadas manualmente se confirman automáticamente
      type: this.appointmentType(),
      reason: this.reason(),
      notes: this.notes(),
      price: this.price(),
      currency: this.currency()
    };

    debugger;
    this.appointmentService.createAppointment(appointment).subscribe({
      next: (appointmentId) => {
        if (appointmentId) {
          this.toastService.success('Cita creada exitosamente');
          this.appointmentCreated.emit();
          this.closeModal();
        } else {
          this.toastService.error('Error al crear la cita');
        }
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Error al crear cita:', error);
        this.toastService.error('Error al crear la cita');
        this.isSaving.set(false);
      }
    });
  }

  closeModal() {
    this.close.emit();
  }

  getCurrencySymbol(): string {
    const currencyMap: { [key: string]: string } = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'PLN': 'zł',
      'UAH': '₴'
    };
    return currencyMap[this.currency()] || this.currency();
  }
}
