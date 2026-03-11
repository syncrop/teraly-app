import { Injectable } from '@angular/core';
import { Appointment } from '../models/appointment.model';
import { BlockedDate, DaySchedule } from '../models/availability.model';

export type AppointmentInterval = Readonly<{
  id?: string;
  startTime: string;
  endTime: string;
  status?: Appointment['status'] | 'cancelled' | string | null;
}>;

export type WeekdayKey =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export interface SlotCandidate {
  time: string; // HH:MM
  endTime: string; // HH:MM
}

export interface SlotAvailability extends SlotCandidate {
  available: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AvailabilitySlotsService {
  private readonly weekdayKeys: readonly WeekdayKey[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  /**
   * Parses a YYYY-MM-DD string as a local Date (avoids UTC shift issues).
   */
  parseLocalDate(date: string): Date | null {
    if (!date) return null;
    const parts = date.split('-').map((p) => Number(p));
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return new Date(year, month - 1, day);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getWeekdayKey(date: string | Date): WeekdayKey | null {
    const d = typeof date === 'string' ? this.parseLocalDate(date) : date;
    if (!d || Number.isNaN(d.getTime())) return null;
    return this.weekdayKeys[d.getDay()] ?? null;
  }

  isDateBlocked(date: string, blockedDates: BlockedDate[]): boolean {
    const check = this.parseLocalDate(date);
    if (!check) return false;
    check.setHours(0, 0, 0, 0);

    return (blockedDates ?? []).some((blocked) => {
      const start = this.parseLocalDate(blocked.startDate);
      const end = this.parseLocalDate(blocked.endDate);
      if (!start || !end) return false;
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return check >= start && check <= end;
    });
  }

  getDayScheduleForDate(date: string, availability: DaySchedule[]): DaySchedule | null {
    const dayKey = this.getWeekdayKey(date);
    if (!dayKey) return null;
    return (availability ?? []).find((d) => d.day === dayKey) ?? null;
  }

  isDateEnabled(date: string, availability: DaySchedule[], blockedDates: BlockedDate[]): boolean {
    if (this.isDateBlocked(date, blockedDates ?? [])) return false;
    const daySchedule = this.getDayScheduleForDate(date, availability ?? []);
    return !!daySchedule && !!daySchedule.enabled && (daySchedule.slots?.length ?? 0) > 0;
  }

  timeToMinutes(time: string): number | null {
    if (!time) return null;
    const [hoursRaw, minutesRaw] = time.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 0 || hours > 23) return null;
    if (minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  minutesToTime(minutes: number): string {
    const normalized = ((Math.floor(minutes) % (24 * 60)) + 24 * 60) % (24 * 60);
    const hour = Math.floor(normalized / 60);
    const minute = normalized % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  /**
   * Generates canonical slot candidates for a given date based on weekly availability, session duration and breaks.
   * If the date is blocked or has no schedules, returns an empty array.
   */
  generateSlotCandidatesForDate(params: {
    date: string; // YYYY-MM-DD
    availability: DaySchedule[];
    sessionDurationMinutes: number;
    breakMinutes: number;
    blockedDates?: BlockedDate[];
    omitPastOnToday?: boolean;
    now?: Date;
  }): SlotCandidate[] {
    const {
      date,
      availability,
      sessionDurationMinutes,
      breakMinutes,
      blockedDates = [],
      omitPastOnToday = false,
      now = new Date(),
    } = params;

    if (!date) return [];
    if (this.isDateBlocked(date, blockedDates)) return [];

    const daySchedule = this.getDayScheduleForDate(date, availability);
    if (!daySchedule || !daySchedule.enabled || (daySchedule.slots?.length ?? 0) === 0) {
      return [];
    }

    const sessionDuration = Number(sessionDurationMinutes);
    const rest = Number(breakMinutes);
    if (!Number.isFinite(sessionDuration) || sessionDuration <= 0) return [];
    if (!Number.isFinite(rest) || rest < 0) return [];

    const selectedLocalDate = this.parseLocalDate(date);
    const nowLocalDate = new Date(now);
    if (selectedLocalDate) {
      selectedLocalDate.setHours(0, 0, 0, 0);
    }
    nowLocalDate.setHours(0, 0, 0, 0);
    const isToday =
      !!selectedLocalDate && selectedLocalDate.getTime() === nowLocalDate.getTime();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const slotByTime = new Map<string, SlotCandidate>();

    for (const range of daySchedule.slots ?? []) {
      const start = this.timeToMinutes(range.start);
      const end = this.timeToMinutes(range.end);
      if (start == null || end == null) continue;

      let cursor = start;
      let endTime = end;

      // Handles ranges that wrap past midnight.
      if (endTime <= cursor) {
        endTime += 24 * 60;
      }

      while (cursor + sessionDuration <= endTime) {
        const slotStartLocal = cursor;
        const slotEndLocal = cursor + sessionDuration;

        const time = this.minutesToTime(slotStartLocal);
        const endSlot = this.minutesToTime(slotEndLocal);

        if (!(omitPastOnToday && isToday && slotStartLocal <= nowMinutes)) {
          if (!slotByTime.has(time)) {
            slotByTime.set(time, { time, endTime: endSlot });
          }
        }

        cursor += sessionDuration + rest;
      }
    }

    const slots = Array.from(slotByTime.values());
    slots.sort((a, b) => {
      const am = this.timeToMinutes(a.time) ?? 0;
      const bm = this.timeToMinutes(b.time) ?? 0;
      return am - bm;
    });

    return slots;
  }

  /**
   * Returns true if a given slot overlaps with an appointment interval.
   */
  intervalsOverlap(params: {
    startA: string;
    endA: string;
    startB: string;
    endB: string;
  }): boolean {
    const startA = this.timeToMinutes(params.startA);
    const endA0 = this.timeToMinutes(params.endA);
    const startB = this.timeToMinutes(params.startB);
    const endB0 = this.timeToMinutes(params.endB);
    if (startA == null || endA0 == null || startB == null || endB0 == null) return false;

    let endA = endA0;
    let endB = endB0;

    // Allow overnight intervals.
    if (endA <= startA) endA += 24 * 60;
    if (endB <= startB) endB += 24 * 60;

    return startA < endB && endA > startB;
  }

  isTimeSlotAvailableAgainstAppointments(params: {
    startTime: string;
    endTime: string;
    appointments: AppointmentInterval[];
    excludeAppointmentId?: string;
  }): boolean {
    const { startTime, endTime, appointments, excludeAppointmentId } = params;

    const blocking = (appointments ?? []).filter((apt) => {
      if (!apt) return false;
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      // Missing status means it's blocking (public endpoint purpose).
      return apt.status == null ? true : apt.status !== 'cancelled';
    });

    const hasConflict = blocking.some((apt) =>
      this.intervalsOverlap({
        startA: startTime,
        endA: endTime,
        startB: apt.startTime,
        endB: apt.endTime,
      })
    );

    return !hasConflict;
  }

  markSlotAvailability(params: {
    slots: SlotCandidate[];
    appointments: AppointmentInterval[];
    excludeAppointmentId?: string;
  }): SlotAvailability[] {
    const { slots, appointments, excludeAppointmentId } = params;

    return (slots ?? []).map((slot) => {
      const available = this.isTimeSlotAvailableAgainstAppointments({
        startTime: slot.time,
        endTime: slot.endTime,
        appointments,
        excludeAppointmentId,
      });

      return { ...slot, available };
    });
  }
}
