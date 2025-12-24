import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient, PatientFilter } from '../../../models/patient.model';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.component.html',
})
export class PatientsComponent implements OnInit {
  private router = inject(Router);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);

  // Estado
  allPatients = signal<Patient[]>([]);
  searchQuery = signal('');
  selectedFilter = signal<PatientFilter>('active');
  isLoading = signal(true);

  // Computed
  filteredPatients = computed(() => {
    const patients = this.allPatients();
    const filter = this.selectedFilter();
    const query = this.searchQuery().toLowerCase().trim();

    let filtered = patients;

    // Filtrar por estado
    if (filter === 'active') {
      filtered = patients.filter(p => p.status === 'active');
    } else if (filter === 'pending') {
      filtered = patients.filter(p => p.status === 'pending');
    } else if (filter === 'archived') {
      filtered = patients.filter(p => p.status === 'archived');
    }

    // Filtrar por búsqueda
    if (query) {
      filtered = filtered.filter(p =>
        p.fullName.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  activePatientsCount = computed(() => 
    this.allPatients().filter(p => p.status === 'active').length
  );

  pendingPatientsCount = computed(() => 
    this.allPatients().filter(p => p.status === 'pending').length
  );

  archivedPatientsCount = computed(() => 
    this.allPatients().filter(p => p.status === 'archived').length
  );

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    const doctorId = this.authService.getCurrentUserId();
    if (!doctorId) {
      this.isLoading.set(false);
      return;
    }

    this.patientService.getDoctorPatients(doctorId).subscribe({
      next: (patients) => {
        this.allPatients.set(patients);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        this.isLoading.set(false);
      }
    });
  }

  selectFilter(filter: PatientFilter) {
    this.selectedFilter.set(filter);
  }

  viewPatientDetail(patient: Patient) {
    this.router.navigate(['/app/calendar']);
  }

  startChat(patient: Patient) {
    // TODO: Implementar chat
    console.log('Iniciar chat con:', patient.fullName);
  }

  callPatient(patient: Patient) {
    // TODO: Implementar llamada
    console.log('Llamar a:', patient.fullName);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  }

  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInWeeks === 1) return 'Hace 1 semana';
    if (diffInWeeks < 4) return `Hace ${diffInWeeks} semanas`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  goBack() {
    this.router.navigate(['/app/profile']);
  }
}
