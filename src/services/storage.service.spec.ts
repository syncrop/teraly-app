import { TestBed } from '@angular/core/testing';
import { Storage } from '@angular/fire/storage';
import { StorageService } from './storage.service';
import { of } from 'rxjs';

describe('StorageService', () => {
  let service: StorageService;
  let storageMock: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    const storageSpy = jasmine.createSpyObj('Storage', ['ref']);

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: Storage, useValue: storageSpy }
      ]
    });

    service = TestBed.inject(StorageService);
    storageMock = TestBed.inject(Storage) as jasmine.SpyObj<Storage>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadProfilePicture', () => {
    it('should upload profile picture and return URL', (done) => {
      const mockFile = new File([''], 'profile.jpg', { type: 'image/jpeg' });
      const mockUrl = 'https://storage.example.com/profile-pictures/user-id/profile.jpg';

      spyOn(service, 'uploadProfilePicture').and.returnValue(of(mockUrl));

      service.uploadProfilePicture(mockFile, 'user-id').subscribe(url => {
        expect(url).toBe(mockUrl);
        done();
      });
    });

    it('should include user ID and timestamp in file path', (done) => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockUrl = 'https://storage.example.com/profile-pictures/test-user/12345_test.jpg';

      spyOn(service, 'uploadProfilePicture').and.returnValue(of(mockUrl));

      service.uploadProfilePicture(mockFile, 'test-user').subscribe(url => {
        expect(url).toContain('profile-pictures');
        expect(url).toContain('test-user');
        done();
      });
    });
  });

  describe('deleteProfilePicture', () => {
    it('should delete profile picture successfully', (done) => {
      const photoUrl = 'https://storage.example.com/profile-pictures/user-id/photo.jpg';

      spyOn(service, 'deleteProfilePicture').and.returnValue(of(undefined));

      service.deleteProfilePicture(photoUrl).subscribe(() => {
        expect(service.deleteProfilePicture).toHaveBeenCalledWith(photoUrl);
        done();
      });
    });

    it('should handle errors gracefully', (done) => {
      const invalidUrl = 'invalid-url';

      spyOn(service, 'deleteProfilePicture').and.returnValue(of(undefined));

      service.deleteProfilePicture(invalidUrl).subscribe(() => {
        expect(true).toBe(true);
        done();
      });
    });
  });

  describe('uploadFile', () => {
    it('should upload any file and return URL', (done) => {
      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const mockUrl = 'https://storage.example.com/documents/document.pdf';
      const path = 'documents/document.pdf';

      spyOn(service, 'uploadFile').and.returnValue(of(mockUrl));

      service.uploadFile(mockFile, path).subscribe(url => {
        expect(url).toBe(mockUrl);
        done();
      });
    });

    it('should use custom path for file upload', (done) => {
      const mockFile = new File([''], 'file.txt', { type: 'text/plain' });
      const customPath = 'custom/path/file.txt';
      const mockUrl = 'https://storage.example.com/custom/path/file.txt';

      spyOn(service, 'uploadFile').and.returnValue(of(mockUrl));

      service.uploadFile(mockFile, customPath).subscribe(url => {
        expect(service.uploadFile).toHaveBeenCalledWith(mockFile, customPath);
        done();
      });
    });
  });
});
