import { TestBed } from '@angular/core/testing';
import { Firestore, DocumentReference } from '@angular/fire/firestore';
import { UserService } from './user.service';
import { AppUser } from '../models/user.model';
import { of, throwError } from 'rxjs';

describe('UserService', () => {
  let service: UserService;
  let firestoreMock: jasmine.SpyObj<Firestore>;

  const mockUser: AppUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'client',
    createdAt: new Date(),
    isVerified: true,
    languages: ['es']
  };

  const mockDoctor: AppUser = {
    uid: 'doctor-uid',
    email: 'doctor@example.com',
    fullName: 'Dr. Test',
    role: 'doctor',
    createdAt: new Date(),
    isVerified: true,
    specialty: 'Psicología',
    languages: ['es', 'en'],
    completed: true
  };

  beforeEach(() => {
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection', 'doc']);

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: Firestore, useValue: firestoreSpy }
      ]
    });

    service = TestBed.inject(UserService);
    firestoreMock = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUserById', () => {
    it('should return user data when user exists', (done) => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ ...mockUser, uid: undefined }),
        id: 'test-uid'
      };

      spyOn(service as any, 'getUserById').and.returnValue(of(mockUser));

      service.getUserById('test-uid').subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(user?.uid).toBe('test-uid');
        done();
      });
    });

    it('should return null when user does not exist', (done) => {
      spyOn(service as any, 'getUserById').and.returnValue(of(null));

      service.getUserById('non-existent').subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });

    it('should handle errors gracefully', (done) => {
      spyOn(service as any, 'getUserById').and.returnValue(of(null));

      service.getUserById('error-uid').subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('getDoctors', () => {
    it('should return array of doctors', (done) => {
      const mockDoctors = [mockDoctor];
      spyOn(service, 'getDoctors').and.returnValue(of(mockDoctors));

      service.getDoctors().subscribe(doctors => {
        expect(doctors.length).toBe(1);
        expect(doctors[0].role).toBe('doctor');
        done();
      });
    });

    it('should return empty array on error', (done) => {
      spyOn(service, 'getDoctors').and.returnValue(of([]));

      service.getDoctors().subscribe(doctors => {
        expect(doctors).toEqual([]);
        done();
      });
    });
  });

  describe('getDoctorById', () => {
    it('should return doctor when exists and is doctor role', (done) => {
      spyOn(service, 'getDoctorById').and.returnValue(of(mockDoctor));

      service.getDoctorById('doctor-uid').subscribe(doctor => {
        expect(doctor).toEqual(mockDoctor);
        expect(doctor?.role).toBe('doctor');
        done();
      });
    });

    it('should return null when user is not a doctor', (done) => {
      spyOn(service, 'getDoctorById').and.returnValue(of(null));

      service.getDoctorById('client-uid').subscribe(doctor => {
        expect(doctor).toBeNull();
        done();
      });
    });
  });

  describe('getClients', () => {
    it('should return array of clients', (done) => {
      const mockClients = [mockUser];
      spyOn(service, 'getClients').and.returnValue(of(mockClients));

      service.getClients().subscribe(clients => {
        expect(clients.length).toBe(1);
        expect(clients[0].role).toBe('client');
        done();
      });
    });
  });

  describe('updateProfilePicture', () => {
    it('should update profile picture successfully', (done) => {
      spyOn(service, 'updateProfilePicture').and.returnValue(of(true));

      service.updateProfilePicture('test-uid', 'https://example.com/photo.jpg').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should handle update errors', (done) => {
      spyOn(service, 'updateProfilePicture').and.returnValue(of(false));

      service.updateProfilePicture('error-uid', 'url').subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  describe('removeProfilePicture', () => {
    it('should remove profile picture successfully', (done) => {
      spyOn(service, 'removeProfilePicture').and.returnValue(of(true));

      service.removeProfilePicture('test-uid').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('refreshUserData', () => {
    it('should refresh user data by calling getUserById', (done) => {
      spyOn(service, 'getUserById').and.returnValue(of(mockUser));

      service.refreshUserData('test-uid').subscribe(user => {
        expect(service.getUserById).toHaveBeenCalledWith('test-uid');
        expect(user).toEqual(mockUser);
        done();
      });
    });
  });
});
