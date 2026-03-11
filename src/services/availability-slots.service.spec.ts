import { TestBed } from '@angular/core/testing';
import { AvailabilitySlotsService } from './availability-slots.service';
import { DaySchedule, BlockedDate } from '../models/availability.model';
import { Appointment } from '../models/appointment.model';

describe('AvailabilitySlotsService', () => {
  let service: AvailabilitySlotsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AvailabilitySlotsService],
    });

    service = TestBed.inject(AvailabilitySlotsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateSlotCandidatesForDate', () => {
    it('should generate slots based on duration and breaks', () => {
      const availability: DaySchedule[] = [
        {
          day: 'monday',
          dayName: 'Lunes',
          enabled: true,
          isExpanded: false,
          slots: [{ start: '09:00', end: '10:00' }],
        },
      ];

      const slots = service.generateSlotCandidatesForDate({
        date: '2024-01-15', // Monday
        availability,
        sessionDurationMinutes: 30,
        breakMinutes: 0,
        blockedDates: [],
      });

      expect(slots.map((s) => s.time)).toEqual(['09:00', '09:30']);
      expect(slots.map((s) => s.endTime)).toEqual(['09:30', '10:00']);
    });

    it('should handle ranges that wrap past midnight', () => {
      const availability: DaySchedule[] = [
        {
          day: 'monday',
          dayName: 'Lunes',
          enabled: true,
          isExpanded: false,
          slots: [{ start: '22:00', end: '01:00' }],
        },
      ];

      const slots = service.generateSlotCandidatesForDate({
        date: '2024-01-15', // Monday
        availability,
        sessionDurationMinutes: 60,
        breakMinutes: 0,
        blockedDates: [],
      });

      expect(slots.map((s) => s.time)).toEqual(['00:00', '22:00', '23:00']);
    });

    it('should return empty list when date is blocked', () => {
      const availability: DaySchedule[] = [
        {
          day: 'monday',
          dayName: 'Lunes',
          enabled: true,
          isExpanded: false,
          slots: [{ start: '09:00', end: '12:00' }],
        },
      ];

      const blockedDates: BlockedDate[] = [
        {
          startDate: '2024-01-15',
          endDate: '2024-01-15',
          reason: 'Holiday',
          dateRange: '15 Enero',
        },
      ];

      const slots = service.generateSlotCandidatesForDate({
        date: '2024-01-15',
        availability,
        sessionDurationMinutes: 60,
        breakMinutes: 0,
        blockedDates,
      });

      expect(slots.length).toBe(0);
    });
  });

  describe('isTimeSlotAvailableAgainstAppointments', () => {
    it('should mark overlapping intervals as unavailable', () => {
      const appointments: Appointment[] = [
        {
          id: 'apt-1',
          doctorId: 'doc-1',
          clientId: 'c-1',
          clientName: 'Client',
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          duration: 60,
          status: 'confirmed',
          type: 'video',
          price: 50,
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      expect(
        service.isTimeSlotAvailableAgainstAppointments({
          startTime: '10:30',
          endTime: '11:30',
          appointments,
        })
      ).toBeFalse();

      expect(
        service.isTimeSlotAvailableAgainstAppointments({
          startTime: '11:00',
          endTime: '12:00',
          appointments,
        })
      ).toBeTrue();
    });

    it('should ignore cancelled appointments', () => {
      const appointments: Appointment[] = [
        {
          id: 'apt-1',
          doctorId: 'doc-1',
          clientId: 'c-1',
          clientName: 'Client',
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          duration: 60,
          status: 'cancelled',
          type: 'video',
          price: 50,
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      expect(
        service.isTimeSlotAvailableAgainstAppointments({
          startTime: '10:30',
          endTime: '11:30',
          appointments,
        })
      ).toBeTrue();
    });

    it('should support excluding an appointment id', () => {
      const appointments: Appointment[] = [
        {
          id: 'apt-1',
          doctorId: 'doc-1',
          clientId: 'c-1',
          clientName: 'Client',
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          duration: 60,
          status: 'confirmed',
          type: 'video',
          price: 50,
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      expect(
        service.isTimeSlotAvailableAgainstAppointments({
          startTime: '10:30',
          endTime: '11:30',
          appointments,
          excludeAppointmentId: 'apt-1',
        })
      ).toBeTrue();
    });
  });
});
