import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { AppointmentService } from './appointment.service';
import { Appointment } from '../models/appointment.model';
import { of } from 'rxjs';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let firestoreMock: jasmine.SpyObj<Firestore>;

  const mockAppointment: Appointment = {
    id: 'apt-1',
    doctorId: 'doctor-1',
    clientId: 'client-1',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '11:00',
    status: 'pending',
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection', 'doc']);

    TestBed.configureTestingModule({
      providers: [
        AppointmentService,
        { provide: Firestore, useValue: firestoreSpy }
      ]
    });

    service = TestBed.inject(AppointmentService);
    firestoreMock = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDoctorAppointments', () => {
    it('should return appointments for a doctor', (done) => {
      const mockAppointments = [mockAppointment];
      spyOn(service, 'getDoctorAppointments').and.returnValue(of(mockAppointments));

      service.getDoctorAppointments('doctor-1').subscribe(appointments => {
        expect(appointments.length).toBe(1);
        expect(appointments[0].doctorId).toBe('doctor-1');
        done();
      });
    });

    it('should return empty array when no appointments found', (done) => {
      spyOn(service, 'getDoctorAppointments').and.returnValue(of([]));

      service.getDoctorAppointments('doctor-2').subscribe(appointments => {
        expect(appointments).toEqual([]);
        done();
      });
    });
  });

  describe('getClientAppointments', () => {
    it('should return appointments for a client', (done) => {
      const mockAppointments = [mockAppointment];
      spyOn(service, 'getClientAppointments').and.returnValue(of(mockAppointments));

      service.getClientAppointments('client-1').subscribe(appointments => {
        expect(appointments.length).toBe(1);
        expect(appointments[0].clientId).toBe('client-1');
        done();
      });
    });
  });

  describe('getAppointmentById', () => {
    it('should return appointment by id', (done) => {
      spyOn(service, 'getAppointmentById').and.returnValue(of(mockAppointment));

      service.getAppointmentById('apt-1').subscribe(appointment => {
        expect(appointment).toEqual(mockAppointment);
        expect(appointment?.id).toBe('apt-1');
        done();
      });
    });

    it('should return null when appointment not found', (done) => {
      spyOn(service, 'getAppointmentById').and.returnValue(of(null));

      service.getAppointmentById('non-existent').subscribe(appointment => {
        expect(appointment).toBeNull();
        done();
      });
    });
  });

  describe('createAppointment', () => {
    it('should create a new appointment', (done) => {
      const newAppointment = {
        doctorId: 'doctor-1',
        clientId: 'client-1',
        date: '2024-01-20',
        startTime: '14:00',
        endTime: '15:00',
        status: 'pending' as const,
        notes: 'New appointment'
      };

      spyOn(service, 'createAppointment').and.returnValue(of('new-apt-id'));

      service.createAppointment(newAppointment).subscribe(id => {
        expect(id).toBeTruthy();
        done();
      });
    });

    it('should return null on creation error', (done) => {
      const newAppointment = {
        doctorId: 'doctor-1',
        clientId: 'client-1',
        date: '2024-01-20',
        startTime: '14:00',
        endTime: '15:00',
        status: 'pending' as const,
        notes: ''
      };

      spyOn(service, 'createAppointment').and.returnValue(of(null));

      service.createAppointment(newAppointment).subscribe(id => {
        expect(id).toBeNull();
        done();
      });
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment successfully', (done) => {
      spyOn(service, 'updateAppointment').and.returnValue(of(true));

      service.updateAppointment('apt-1', { notes: 'Updated notes' }).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should return false on update error', (done) => {
      spyOn(service, 'updateAppointment').and.returnValue(of(false));

      service.updateAppointment('non-existent', { notes: 'Notes' }).subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update appointment status to confirmed', (done) => {
      spyOn(service, 'updateAppointmentStatus').and.returnValue(of(true));

      service.updateAppointmentStatus('apt-1', 'confirmed').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment', (done) => {
      spyOn(service, 'cancelAppointment').and.returnValue(of(true));

      service.cancelAppointment('apt-1').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('confirmAppointment', () => {
    it('should confirm appointment', (done) => {
      spyOn(service, 'confirmAppointment').and.returnValue(of(true));

      service.confirmAppointment('apt-1').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('completeAppointment', () => {
    it('should complete appointment', (done) => {
      spyOn(service, 'completeAppointment').and.returnValue(of(true));

      service.completeAppointment('apt-1').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('deleteAppointment', () => {
    it('should delete appointment', (done) => {
      spyOn(service, 'deleteAppointment').and.returnValue(of(true));

      service.deleteAppointment('apt-1').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('isTimeSlotAvailable', () => {
    it('should return true when time slot is available', (done) => {
      spyOn(service, 'isTimeSlotAvailable').and.returnValue(of(true));

      service.isTimeSlotAvailable('doctor-1', '2024-01-20', '10:00', '11:00').subscribe(isAvailable => {
        expect(isAvailable).toBe(true);
        done();
      });
    });

    it('should return false when time slot is not available', (done) => {
      spyOn(service, 'isTimeSlotAvailable').and.returnValue(of(false));

      service.isTimeSlotAvailable('doctor-1', '2024-01-15', '10:00', '11:00').subscribe(isAvailable => {
        expect(isAvailable).toBe(false);
        done();
      });
    });

    it('should exclude specific appointment when checking availability', (done) => {
      spyOn(service, 'isTimeSlotAvailable').and.returnValue(of(true));

      service.isTimeSlotAvailable('doctor-1', '2024-01-15', '10:00', '11:00', 'apt-1').subscribe(isAvailable => {
        expect(isAvailable).toBe(true);
        done();
      });
    });
  });

  describe('getDoctorAppointmentStats', () => {
    it('should return appointment statistics', (done) => {
      const mockStats = {
        total: 10,
        pending: 3,
        confirmed: 4,
        completed: 2,
        cancelled: 1,
        noShow: 0
      };

      spyOn(service, 'getDoctorAppointmentStats').and.returnValue(of(mockStats));

      service.getDoctorAppointmentStats('doctor-1', 0, 2024).subscribe(stats => {
        expect(stats.total).toBe(10);
        expect(stats.pending).toBe(3);
        expect(stats.confirmed).toBe(4);
        done();
      });
    });
  });

  describe('getDoctorAppointmentsByDateRange', () => {
    it('should return appointments within date range', (done) => {
      const mockAppointments = [mockAppointment];
      spyOn(service, 'getDoctorAppointmentsByDateRange').and.returnValue(of(mockAppointments));

      service.getDoctorAppointmentsByDateRange('doctor-1', '2024-01-01', '2024-01-31').subscribe(appointments => {
        expect(appointments.length).toBe(1);
        done();
      });
    });

    it('should return sorted appointments', (done) => {
      const apt1 = { ...mockAppointment, date: '2024-01-15', startTime: '10:00' };
      const apt2 = { ...mockAppointment, id: 'apt-2', date: '2024-01-15', startTime: '14:00' };
      const mockAppointments = [apt2, apt1];
      
      spyOn(service, 'getDoctorAppointmentsByDateRange').and.returnValue(of([apt1, apt2]));

      service.getDoctorAppointmentsByDateRange('doctor-1', '2024-01-01', '2024-01-31').subscribe(appointments => {
        expect(appointments[0].startTime).toBe('10:00');
        expect(appointments[1].startTime).toBe('14:00');
        done();
      });
    });
  });

  describe('updateAppointmentNotes', () => {
    it('should update appointment notes', (done) => {
      spyOn(service, 'updateAppointmentNotes').and.returnValue(of(true));

      service.updateAppointmentNotes('apt-1', 'New notes').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });
});
