import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchComponent } from './search.component';
import { AuthService } from '../../../services/auth.service';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      currentUserRole: jasmine.createSpy().and.returnValue('client')
    });

    await TestBed.configureTestingModule({
      imports: [SearchComponent, CommonModule, FormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with userRole from authService', () => {
    expect(component.userRole()).toBe('client');
  });

  it('should initialize with empty searchQuery', () => {
    expect(component.searchQuery()).toBe('');
  });

  it('should initialize with showFilters as false', () => {
    expect(component.showFilters()).toBe(false);
  });

  it('should initialize with selectedFilter as "all"', () => {
    expect(component.selectedFilter()).toBe('all');
  });

  it('should have mock doctors data', () => {
    expect(component.doctors.length).toBe(3);
    expect(component.doctors[0].specialty).toBeDefined();
  });

  it('should have mock clients data', () => {
    expect(component.clients.length).toBe(2);
    expect(component.clients[0].status).toBeDefined();
  });

  describe('filteredResults - Client role', () => {
    beforeEach(() => {
      component.userRole.set('client');
    });

    it('should return all doctors when search is empty', () => {
      component.searchQuery.set('');
      const results = component.filteredResults;
      expect(results.length).toBe(3);
    });

    it('should filter doctors by name', () => {
      component.searchQuery.set('Javier');
      const results = component.filteredResults;
      expect(results.length).toBe(1);
      expect((results[0] as any).name).toContain('Javier');
    });

    it('should filter doctors by specialty', () => {
      component.searchQuery.set('Psicología');
      const results = component.filteredResults;
      expect(results.length).toBe(1);
      expect((results[0] as any).specialty).toContain('Psicología');
    });

    it('should be case-insensitive', () => {
      component.searchQuery.set('JAVIER');
      const results = component.filteredResults;
      expect(results.length).toBe(1);
    });

    it('should return empty array when no matches', () => {
      component.searchQuery.set('NonExistentDoctor');
      const results = component.filteredResults;
      expect(results.length).toBe(0);
    });

    it('should filter with partial matches', () => {
      component.searchQuery.set('Dr');
      const results = component.filteredResults;
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('filteredResults - Doctor role', () => {
    beforeEach(() => {
      component.userRole.set('doctor');
    });

    it('should return both doctors and clients when filter is "all"', () => {
      component.selectedFilter.set('all');
      component.searchQuery.set('');
      const results = component.filteredResults;
      expect(results.length).toBe(5); // 3 doctors + 2 clients
    });

    it('should return only doctors when filter is "doctors"', () => {
      component.selectedFilter.set('doctors');
      component.searchQuery.set('');
      const results = component.filteredResults;
      expect(results.length).toBe(3);
    });

    it('should return only clients when filter is "clients"', () => {
      component.selectedFilter.set('clients');
      component.searchQuery.set('');
      const results = component.filteredResults;
      expect(results.length).toBe(2);
    });

    it('should filter doctors by name when filter is "doctors"', () => {
      component.selectedFilter.set('doctors');
      component.searchQuery.set('María');
      const results = component.filteredResults;
      expect(results.length).toBe(1);
      expect((results[0] as any).name).toContain('María');
    });

    it('should filter clients by name when filter is "clients"', () => {
      component.selectedFilter.set('clients');
      component.searchQuery.set('Juan');
      const results = component.filteredResults;
      expect(results.length).toBe(1);
      expect((results[0] as any).name).toContain('Juan');
    });

    it('should filter all results when filter is "all"', () => {
      component.selectedFilter.set('all');
      component.searchQuery.set('a');
      const results = component.filteredResults;
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive for all filters', () => {
      component.selectedFilter.set('doctors');
      component.searchQuery.set('CARLOS');
      const results = component.filteredResults;
      expect(results.length).toBe(1);
    });
  });

  describe('toggleFilters', () => {
    it('should toggle showFilters from false to true', () => {
      component.showFilters.set(false);
      component.toggleFilters();
      expect(component.showFilters()).toBe(true);
    });

    it('should toggle showFilters from true to false', () => {
      component.showFilters.set(true);
      component.toggleFilters();
      expect(component.showFilters()).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      component.showFilters.set(false);
      component.toggleFilters();
      expect(component.showFilters()).toBe(true);
      component.toggleFilters();
      expect(component.showFilters()).toBe(false);
      component.toggleFilters();
      expect(component.showFilters()).toBe(true);
    });
  });

  describe('setFilter', () => {
    it('should update selectedFilter', () => {
      component.setFilter('doctors');
      expect(component.selectedFilter()).toBe('doctors');
    });

    it('should change filter to "clients"', () => {
      component.setFilter('clients');
      expect(component.selectedFilter()).toBe('clients');
    });

    it('should change filter to "all"', () => {
      component.setFilter('all');
      expect(component.selectedFilter()).toBe('all');
    });

    it('should handle multiple filter changes', () => {
      component.setFilter('doctors');
      expect(component.selectedFilter()).toBe('doctors');
      
      component.setFilter('clients');
      expect(component.selectedFilter()).toBe('clients');
      
      component.setFilter('all');
      expect(component.selectedFilter()).toBe('all');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in search', () => {
      component.searchQuery.set('Dr.');
      const results = component.filteredResults;
      expect(results).toBeDefined();
    });

    it('should handle very long search query', () => {
      const longQuery = 'a'.repeat(1000);
      component.searchQuery.set(longQuery);
      const results = component.filteredResults;
      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });

    it('should handle search with only spaces', () => {
      component.searchQuery.set('   ');
      const results = component.filteredResults;
      expect(results).toBeDefined();
    });

    it('should handle Unicode characters in search', () => {
      component.searchQuery.set('González');
      const results = component.filteredResults;
      expect(results.length).toBe(1);
    });

    it('should return results for accented characters', () => {
      component.searchQuery.set('María');
      const results = component.filteredResults;
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle filter changes while searching', () => {
      component.userRole.set('doctor');
      component.searchQuery.set('a');
      component.selectedFilter.set('doctors');
      const doctorResults = component.filteredResults.length;
      
      component.selectedFilter.set('clients');
      const clientResults = component.filteredResults.length;
      
      expect(doctorResults).not.toBe(clientResults);
    });

    it('should handle empty doctors array gracefully', () => {
      const originalDoctors = component.doctors;
      component.doctors = [];
      component.searchQuery.set('test');
      const results = component.filteredResults;
      expect(results.length).toBe(0);
      component.doctors = originalDoctors;
    });

    it('should handle empty clients array gracefully', () => {
      const originalClients = component.clients;
      component.clients = [];
      component.userRole.set('doctor');
      component.selectedFilter.set('clients');
      component.searchQuery.set('test');
      const results = component.filteredResults;
      expect(results.length).toBe(0);
      component.clients = originalClients;
    });

    it('should handle null or undefined userRole gracefully', () => {
      component.userRole.set(null as any);
      component.searchQuery.set('test');
      expect(() => component.filteredResults).not.toThrow();
    });
  });
});
