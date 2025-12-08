import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, SlicePipe, FormsModule]
})
export class SearchComponent {
  private authService = inject(AuthService);

  userRole = signal(this.authService.currentUserRole());
  searchQuery = signal('');
  showFilters = signal(false);
  selectedFilter = signal('all');

  // Mock data - doctors
  doctors = [
    {
      id: 1,
      name: 'Dr. Javier Perez',
      specialty: 'Psicología Clínica',
      rating: 4.8,
      reviews: 124,
      image: 'https://via.placeholder.com/64',
      availability: 'Disponible hoy',
      price: '$50/sesión'
    },
    {
      id: 2,
      name: 'Dra. María González',
      specialty: 'Terapia Cognitivo-Conductual',
      rating: 4.9,
      reviews: 98,
      image: 'https://via.placeholder.com/64',
      availability: 'Disponible mañana',
      price: '$60/sesión'
    },
    {
      id: 3,
      name: 'Dr. Carlos López',
      specialty: 'Psicoanálisis',
      rating: 4.7,
      reviews: 156,
      image: 'https://via.placeholder.com/64',
      availability: 'Disponible en 2 días',
      price: '$70/sesión'
    }
  ];

  // Mock data - clients
  clients = [
    {
      id: 1,
      name: 'Juan Martinez',
      status: 'Buscando terapeuta',
      image: 'https://via.placeholder.com/64',
      joined: 'Hace 3 meses'
    },
    {
      id: 2,
      name: 'Andrea Ruiz',
      status: 'En tratamiento',
      image: 'https://via.placeholder.com/64',
      joined: 'Hace 1 mes'
    }
  ];

  get filteredResults() {
    const query = this.searchQuery().toLowerCase();

    if (this.userRole() === 'client') {
      // Clientes buscan doctores
      return this.doctors.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.specialty.toLowerCase().includes(query)
      );
    } else {
      // Doctores pueden buscar clientes y otros doctores
      const filter = this.selectedFilter();

      if (filter === 'doctors') {
        return this.doctors.filter(doc =>
          doc.name.toLowerCase().includes(query) ||
          doc.specialty.toLowerCase().includes(query)
        );
      } else if (filter === 'clients') {
        return this.clients.filter(client =>
          client.name.toLowerCase().includes(query)
        );
      } else {
        // 'all' - mezcla de ambos
        const docResults = this.doctors.filter(doc =>
          doc.name.toLowerCase().includes(query) ||
          doc.specialty.toLowerCase().includes(query)
        );
        const clientResults = this.clients.filter(client =>
          client.name.toLowerCase().includes(query)
        );
        return [...docResults, ...clientResults];
      }
    }
  }

  toggleFilters() {
    this.showFilters.update(val => !val);
  }

  setFilter(filter: string) {
    this.selectedFilter.set(filter);
  }
}
