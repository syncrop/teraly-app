import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { MOCK_DOCTORS, MOCK_CLIENTS } from '../../../data/mock-data';
import { getFilteredResults } from '../../../utils/search-filters';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class SearchComponent {
  private authService = inject(AuthService);

  userRole = signal(this.authService.currentUserRole());
  searchQuery = signal('');
  showFilters = signal(false);
  selectedFilter = signal('all');

  doctors = MOCK_DOCTORS;
  clients = MOCK_CLIENTS;

  get filteredResults() {
    return getFilteredResults(
      this.userRole(),
      this.searchQuery(),
      this.selectedFilter(),
      this.doctors,
      this.clients
    );
  }

  toggleFilters() {
    this.showFilters.update(val => !val);
  }

  setFilter(filter: string) {
    this.selectedFilter.set(filter);
  }
}
