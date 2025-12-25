import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { AppointmentService } from '../../../services/appointment.service';
import { ToastService } from '../../../services/toast.service';
import { Appointment, CalendarDay, MonthView, AppointmentSlot } from '../../../models/appointment.model';
import { AddAppointmentModalComponent } from './add-appointment-modal/add-appointment-modal.component';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { DaySchedule, BlockedDate } from '../../../models/availability.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, AddAppointmentModalComponent],
  templateUrl: './calendar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private toastService = inject(ToastService);
  private firestore = inject(Firestore);

  // Disponibilidad del doctor
  private doctorAvailability = signal<DaySchedule[]>([]);
  private blockedDates = signal<BlockedDate[]>([]);

  // Vista actual: 'month' o 'day'
  currentView = signal<'month' | 'day'>('month');
  
  // Fecha seleccionada
  selectedDate = signal<Date>(new Date());
  
  // Mes y año actuales para navegación
  currentMonth = signal<number>(new Date().getMonth());
  currentYear = signal<number>(new Date().getFullYear());
  
  // Todas las citas del doctor
  allAppointments = signal<Appointment[]>([]);
  
  // Citas filtradas por fecha seleccionada
  selectedDateAppointments = signal<Appointment[]>([]);
  
  // Loading state
  isLoading = signal(true);
  
  // Cita seleccionada para ver detalles
  selectedAppointment = signal<Appointment | null>(null);
  showAppointmentModal = signal(false);
  
  // Modal de agregar cita
  showAddAppointmentModal = signal(false);

  // Computed: Nombre del mes actual
  currentMonthName = computed(() => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[this.currentMonth()];
  });

  // Computed: Vista de calendario del mes
  calendarMonthView = computed(() => {
    return this.generateMonthView(this.currentYear(), this.currentMonth());
  });

  // Computed: Slots del día seleccionado
  dayScheduleSlots = computed(() => {
    return this.generateDaySlots(this.selectedDate());
  });

  // Computed: Citas de hoy ordenadas por hora
  todayAppointments = computed(() => {
    const today = new Date();
    const todayStr = this.formatDate(today);
    const appointments = this.allAppointments().filter(apt => apt.date === todayStr);
    return appointments.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  // Computed: Componentes de la fecha de hoy
  todayComponents = computed(() => {
    const today = new Date();
    return {
      day: today.getDate(),
      month: today.getMonth(),
      weekday: today.getDay()
    };
  });

  // Computed: Componentes de la fecha seleccionada
  selectedDateComponents = computed(() => {
    const date = this.selectedDate();
    return {
      day: date.getDate(),
      month: date.getMonth(),
      weekday: date.getDay(),
      year: date.getFullYear()
    };
  });

  ngOnInit() {
    window.scrollTo(0, 0);
    this.loadDoctorAvailability();
    this.loadAppointments();
  }

  /**
   * Cargar todas las citas del doctor
   */
  loadAppointments() {
    const doctorId = this.authService.currentUser()?.uid;
    if (!doctorId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    
    // Obtener rango de fechas del mes actual ± 1 mes
    const startDate = new Date(this.currentYear(), this.currentMonth() - 1, 1);
    const endDate = new Date(this.currentYear(), this.currentMonth() + 2, 0);
    
    const startDateStr = this.formatDate(startDate);
    const endDateStr = this.formatDate(endDate);

    this.appointmentService.getDoctorAppointmentsByDateRange(doctorId, startDateStr, endDateStr).subscribe({
      next: (appointments) => {
        this.allAppointments.set(appointments);
        this.updateSelectedDateAppointments();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.toastService.error('Error al cargar las citas');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Cargar disponibilidad del doctor desde Firestore
   */
  async loadDoctorAvailability() {
    const doctorId = this.authService.currentUser()?.uid;
    if (!doctorId) return;

    try {
      const doctorRef = doc(this.firestore, 'users', doctorId);
      const doctorDoc = await getDoc(doctorRef);
      
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        this.doctorAvailability.set(data['availability'] as DaySchedule[] || []);
        this.blockedDates.set(data['blockedDates'] as BlockedDate[] || []);
      }
    } catch (error) {
      console.error('Error al cargar disponibilidad:', error);
    }
  }

  /**
   * Actualizar citas de la fecha seleccionada
   */
  updateSelectedDateAppointments() {
    const selectedDateStr = this.formatDate(this.selectedDate());
    const appointments = this.allAppointments().filter(apt => apt.date === selectedDateStr);
    this.selectedDateAppointments.set(appointments);
  }

  /**
   * Generar vista del mes
   */
  generateMonthView(year: number, month: number): CalendarDay[][] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevMonthLastDay = new Date(year, month, 0);
    
    const firstDayOfWeek = firstDay.getDay(); // 0 = domingo
    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = prevMonthLastDay.getDate();
    
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    
    const today = new Date();
    const todayStr = this.formatDate(today);
    
    // Días del mes anterior
    const startDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Lunes = 0
    for (let i = startDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      currentWeek.push(this.createCalendarDay(date, false, todayStr));
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      currentWeek.push(this.createCalendarDay(date, true, todayStr));
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Días del mes siguiente
    if (currentWeek.length > 0) {
      const remainingDays = 7 - currentWeek.length;
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        currentWeek.push(this.createCalendarDay(date, false, todayStr));
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }

  /**
   * Crear día del calendario
   */
  createCalendarDay(date: Date, isCurrentMonth: boolean, todayStr: string): CalendarDay {
    const dateStr = this.formatDate(date);
    const appointments = this.allAppointments().filter(apt => apt.date === dateStr);
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Verificar si el día está disponible
    const isAvailable = this.isDayAvailable(date);
    
    return {
      date: dateStr,
      dayNumber: date.getDate(),
      dayName: dayNames[date.getDay()],
      isToday: dateStr === todayStr,
      isCurrentMonth,
      appointments,
      hasAppointments: appointments.length > 0,
      isAvailable
    };
  }

  /**
   * Verificar si un día está disponible según la configuración del doctor
   */
  isDayAvailable(date: Date): boolean {
    // En el calendario, permitir seleccionar todos los días para poder ver las citas
    // Solo deshabilitar días del pasado muy lejano (más de 1 año atrás)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return date >= oneYearAgo;
  }

  /**
   * Generar slots del día con citas
   */
  generateDaySlots(date: Date): AppointmentSlot[] {
    const dateStr = this.formatDate(date);
    const appointments = this.allAppointments().filter(apt => apt.date === dateStr);
    
    const slots: AppointmentSlot[] = [];
    
    // Generar slots de 7:00 AM a 10:00 PM cada 30 minutos
    for (let hour = 7; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Buscar si hay una cita en este horario
        const appointment = appointments.find(apt => apt.startTime === time);
        
        slots.push({
          time,
          appointment,
          isAvailable: !appointment
        });
      }
    }
    
    return slots;
  }

  /**
   * Formatear fecha a YYYY-MM-DD
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Seleccionar día en el calendario
   */
  selectDay(day: CalendarDay) {
    const [year, month, dayNum] = day.date.split('-').map(Number);
    this.selectedDate.set(new Date(year, month - 1, dayNum));
    this.updateSelectedDateAppointments();
    this.currentView.set('day');
  }

  /**
   * Cambiar vista entre mes y día
   */
  toggleView(view: 'month' | 'day') {
    this.currentView.set(view);
  }

  /**
   * Navegar al mes anterior
   */
  previousMonth() {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.set(this.currentYear() - 1);
    } else {
      this.currentMonth.set(this.currentMonth() - 1);
    }
    this.loadAppointments();
  }

  /**
   * Navegar al mes siguiente
   */
  nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.currentMonth.set(this.currentMonth() + 1);
    }
    this.loadAppointments();
  }

  /**
   * Ir a hoy
   */
  goToToday() {
    const today = new Date();
    this.selectedDate.set(today);
    this.currentMonth.set(today.getMonth());
    this.currentYear.set(today.getFullYear());
    this.updateSelectedDateAppointments();
    this.loadAppointments();
  }

  /**
   * Ver detalles de una cita
   */
  viewAppointmentDetails(appointment: Appointment) {
    this.selectedAppointment.set(appointment);
    this.showAppointmentModal.set(true);
  }

  /**
   * Cerrar modal de detalles
   */
  closeAppointmentModal() {
    this.showAppointmentModal.set(false);
    this.selectedAppointment.set(null);
  }

  /**
   * Confirmar una cita
   */
  confirmAppointment(appointmentId: string) {
    this.appointmentService.confirmAppointment(appointmentId).subscribe({
      next: (success) => {
        if (success) {
          this.toastService.success('Cita confirmada');
          this.loadAppointments();
          this.closeAppointmentModal();
        } else {
          this.toastService.error('Error al confirmar la cita');
        }
      },
      error: () => {
        this.toastService.error('Error al confirmar la cita');
      }
    });
  }

  /**
   * Cancelar una cita
   */
  cancelAppointment(appointmentId: string) {
    this.appointmentService.cancelAppointment(appointmentId).subscribe({
      next: (success) => {
        if (success) {
          this.toastService.success('Cita cancelada');
          this.loadAppointments();
          this.closeAppointmentModal();
        } else {
          this.toastService.error('Error al cancelar la cita');
        }
      },
      error: () => {
        this.toastService.error('Error al cancelar la cita');
      }
    });
  }

  /**
   * Iniciar sesión de videollamada
   */
  startVideoCall(appointmentId: string) {
    this.router.navigate(['/app/video-call', appointmentId]);
  }

  /**
   * Completar una cita
   */
  completeAppointment(appointmentId: string) {
    this.appointmentService.completeAppointment(appointmentId).subscribe({
      next: (success) => {
        if (success) {
          this.toastService.success('Cita marcada como completada');
          this.loadAppointments();
          this.closeAppointmentModal();
        } else {
          this.toastService.error('Error al completar la cita');
        }
      },
      error: () => {
        this.toastService.error('Error al completar la cita');
      }
    });
  }

  /**
   * Agregar nueva cita
   */
  addNewAppointment() {
    this.showAddAppointmentModal.set(true);
  }

  /**
   * Cerrar modal de agregar cita
   */
  closeAddAppointmentModal() {
    this.showAddAppointmentModal.set(false);
  }

  /**
   * Callback cuando se crea una cita
   */
  onAppointmentCreated() {
    this.loadAppointments();
    this.showAddAppointmentModal.set(false);
  }

  /**
   * Obtener color del estado
   */
  getStatusColor(status: Appointment['status']): string {
    const colors = {
      'pending': 'bg-orange-100 text-orange-700',
      'confirmed': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700',
      'no-show': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors['pending'];
  }

  /**
   * Volver atrás
   */
  goBack() {
    this.location.back();
  }
}
