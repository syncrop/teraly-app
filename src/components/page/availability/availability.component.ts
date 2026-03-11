import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { TimeSlot, DaySchedule, BlockedDate } from '../../../models/availability.model';
import { isBackendEnabled } from '../../../config/backend.config';
import { UsersApiService } from '../../../services/users-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availability.component.html'
})
export class AvailabilityComponent implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private readonly usersApi = inject(UsersApiService);

  sessionDuration = signal<number>(60);
  breakTime = signal<number>(15);
  isSaving = signal<boolean>(false);
  showBlockedDateModal = signal<boolean>(false);
  blockedDates = signal<BlockedDate[]>([]);
  
  newBlockedDate = {
    startDate: '',
    endDate: '',
    reason: ''
  };

  sessionDurationOptions = [30, 45, 50, 60, 90];
  breakTimeOptions = [0, 5, 10, 15, 20, 30];

  weekSchedule = signal<DaySchedule[]>([
    { day: 'monday', dayName: 'Lunes', enabled: true, slots: [{ start: '09:00', end: '14:00' }, { start: '16:00', end: '20:00' }], isExpanded: true },
    { day: 'tuesday', dayName: 'Martes', enabled: true, slots: [{ start: '09:00', end: '18:00' }], isExpanded: false },
    { day: 'wednesday', dayName: 'Miércoles', enabled: true, slots: [{ start: '09:00', end: '18:00' }], isExpanded: false },
    { day: 'thursday', dayName: 'Jueves', enabled: true, slots: [{ start: '09:00', end: '18:00' }], isExpanded: false },
    { day: 'friday', dayName: 'Viernes', enabled: true, slots: [{ start: '09:00', end: '18:00' }], isExpanded: false },
    { day: 'saturday', dayName: 'Sábado', enabled: false, slots: [], isExpanded: false },
    { day: 'sunday', dayName: 'Domingo', enabled: false, slots: [], isExpanded: false }
  ]);

  ngOnInit() {
    window.scrollTo(0, 0);
    this.loadAvailability();
  }

  async loadAvailability() {
    if (!isBackendEnabled()) {
      this.toastService.error(
        $localize`:@@toast.availability.backendDisabledLoad:La API del backend está deshabilitada. No se puede cargar la disponibilidad.`
      );
      return;
    }

    try {
      const me = await firstValueFrom(this.usersApi.getMe());

      if (me.sessionDuration) {
        this.sessionDuration.set(me.sessionDuration);
      }

      if (me.breakTime !== undefined && me.breakTime !== null) {
        this.breakTime.set(me.breakTime);
      }

      if (me.availability) {
        this.weekSchedule.set(me.availability);
      }

      if (me.blockedDates) {
        this.blockedDates.set(me.blockedDates);
      }
    } catch (error) {
      console.error('Error al cargar disponibilidad:', error);
      this.toastService.error($localize`:@@toast.availability.loadError:Error al cargar la disponibilidad`);
    }
  }

  goBack() {
    this.location.back();
  }

  showAddBlockedDate() {
    this.showBlockedDateModal.set(true);
  }

  closeBlockedDateModal() {
    this.showBlockedDateModal.set(false);
    this.newBlockedDate = {
      startDate: '',
      endDate: '',
      reason: ''
    };
  }

  addBlockedDate() {
    if (!this.newBlockedDate.startDate || !this.newBlockedDate.endDate) {
      this.toastService.error($localize`:@@toast.availability.selectDatesRequired:Debes seleccionar las fechas`);
      return;
    }

    if (!this.newBlockedDate.reason.trim()) {
      this.toastService.error($localize`:@@toast.availability.reasonRequired:Debes indicar un motivo`);
      return;
    }

    const start = new Date(this.newBlockedDate.startDate);
    const end = new Date(this.newBlockedDate.endDate);

    if (end < start) {
      this.toastService.error(
        $localize`:@@toast.availability.endDateAfterStart:La fecha de fin debe ser posterior a la de inicio`
      );
      return;
    }

    // Formatear rango de fechas
    const dateRange = this.formatDateRange(start, end);

    const blocked: BlockedDate = {
      startDate: this.newBlockedDate.startDate,
      endDate: this.newBlockedDate.endDate,
      reason: this.newBlockedDate.reason,
      dateRange
    };

    this.blockedDates.update(dates => [...dates, blocked]);
    this.closeBlockedDateModal();
    this.toastService.success($localize`:@@toast.availability.blockedDateAdded:Día bloqueado añadido`);
  }

  removeBlockedDate(index: number) {
    this.blockedDates.update(dates => {
      const newDates = [...dates];
      newDates.splice(index, 1);
      return newDates;
    });
    this.toastService.success($localize`:@@toast.availability.blockedDateRemoved:Día bloqueado eliminado`);
  }

  formatDateRange(start: Date, end: Date): string {
    const sameDay = start.toDateString() === end.toDateString();
    
    if (sameDay) {
      return this.formatDate(start);
    }
    
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleString('es-ES', { month: 'long' });
    const endMonth = end.toLocaleString('es-ES', { month: 'long' });
    
    if (start.getMonth() === end.getMonth()) {
      return `${startDay} - ${endDay} ${this.capitalize(startMonth)}`;
    } else {
      return `${startDay} ${this.capitalize(startMonth)} - ${endDay} ${this.capitalize(endMonth)}`;
    }
  }

  formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleString('es-ES', { month: 'long' });
    return `${day} ${this.capitalize(month)}`;
  }

  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  toggleDay(index: number) {
    this.weekSchedule.update(schedule => {
      const newSchedule = [...schedule];
      newSchedule[index].enabled = !newSchedule[index].enabled;
      
      // Si se habilita el día y no tiene slots, agregar uno por defecto
      if (newSchedule[index].enabled && newSchedule[index].slots.length === 0) {
        newSchedule[index].slots = [{ start: '09:00', end: '18:00' }];
      }
      
      return newSchedule;
    });
  }

  toggleExpand(index: number) {
    this.weekSchedule.update(schedule => {
      const newSchedule = [...schedule];
      newSchedule[index].isExpanded = !newSchedule[index].isExpanded;
      return newSchedule;
    });
  }

  addTimeSlot(dayIndex: number) {
    this.weekSchedule.update(schedule => {
      const newSchedule = [...schedule];
      newSchedule[dayIndex].slots.push({ start: '09:00', end: '18:00' });
      return newSchedule;
    });
  }

  removeTimeSlot(dayIndex: number, slotIndex: number) {
    const currentSlots = this.weekSchedule()[dayIndex].slots.length;
    if (currentSlots <= 1) {
      this.toastService.error($localize`:@@toast.availability.minOneSlotPerDay:Debe haber al menos un horario por día`);
      return;
    }
    
    this.weekSchedule.update(schedule => {
      const newSchedule = [...schedule];
      newSchedule[dayIndex].slots = [...newSchedule[dayIndex].slots];
      newSchedule[dayIndex].slots.splice(slotIndex, 1);
      return newSchedule;
    });
  }

  updateTimeSlot(dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) {
    this.weekSchedule.update(schedule => {
      const newSchedule = [...schedule];
      newSchedule[dayIndex].slots[slotIndex][field] = value;
      return newSchedule;
    });
  }

  async saveAvailability() {
    if (!isBackendEnabled()) {
      this.toastService.error(
        $localize`:@@toast.availability.backendDisabledSave:La API del backend está deshabilitada. No se puede guardar la disponibilidad.`
      );
      return;
    }

    // Validar que al menos un día esté habilitado
    const hasEnabledDay = this.weekSchedule().some(day => day.enabled);
    if (!hasEnabledDay) {
      this.toastService.error(
        $localize`:@@toast.availability.enableAtLeastOneWeekday:Debes habilitar al menos un día de la semana`
      );
      return;
    }

    this.isSaving.set(true);
    try {
      await firstValueFrom(this.usersApi.upsertMe({
        sessionDuration: this.sessionDuration(),
        breakTime: this.breakTime(),
        availability: this.weekSchedule(),
        blockedDates: this.blockedDates(),
      }));

      this.toastService.success(
        $localize`:@@toast.availability.saveSuccess:Disponibilidad guardada correctamente`
      );
      this.goBack();
    } catch (error) {
      console.error('Error al guardar disponibilidad:', error);
      this.toastService.error($localize`:@@toast.availability.saveError:Error al guardar la disponibilidad`);
    } finally {
      this.isSaving.set(false);
    }
  }

  weekdayLabel(dayKey: string): string {
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
      default:
        return dayKey;
    }
  }
}
