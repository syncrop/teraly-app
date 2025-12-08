import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  tags: string[];
  rating: number;
  reviews: number;
  image: string;
  available: boolean;
  availabilityText?: string;
  nextSlots?: string[];
  priceAmount: number;
  priceCurrency: string;
  pricePerSession: string;
  languages: string[];
  verified: boolean;
}

interface FilterChip {
  id: string;
  label: string;
  icon?: string;
  active: boolean;
  type?: 'toggle' | 'dropdown' | 'range';
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class SearchComponent {
  private authService = inject(AuthService);

  searchQuery = signal('Ansiedad');
  showFiltersModal = signal(false);
  showLanguageDropdown = signal(false);
  showPriceDropdown = signal(false);
  
  filterChips = signal<FilterChip[]>([
    { id: 'language', label: 'Idioma', icon: '🌍', active: false, type: 'dropdown' },
    { id: 'price', label: 'Precio', icon: '💰', active: false, type: 'range' }
  ]);

  availableLanguages: Language[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' }
  ];

  selectedLanguages = signal<string[]>([]);
  priceRange = signal<{ min: number; max: number }>({ min: 0, max: 500 });
  selectedPriceRange = signal<{ min: number; max: number }>({ min: 0, max: 500 });

  // Mock data - doctors
  doctors = signal<Doctor[]>([
    {
      id: 1,
      name: 'Dr. Javier Perez',
      specialty: 'Psicología Clínica',
      tags: ['Ansiedad'],
      rating: 4.9,
      reviews: 124,
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      available: true,
      availabilityText: 'Disponible hoy',
      priceAmount: 50,
      priceCurrency: '€',
      pricePerSession: '/50min',
      languages: ['🇪🇸'],
      verified: false
    },
    {
      id: 2,
      name: 'Dra. Anna Kowalska',
      specialty: 'Terapia Cognitiva',
      tags: ['Depresión'],
      rating: 5.0,
      reviews: 89,
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      available: true,
      nextSlots: ['Mañana 10:00', 'Mañana 14:30'],
      priceAmount: 240,
      priceCurrency: 'zł',
      pricePerSession: '/50min',
      languages: ['🇵🇱', '🇬🇧'],
      verified: true
    },
    {
      id: 3,
      name: 'Dr. Carlos Méndez',
      specialty: 'Psicología Infantil',
      tags: ['Ansiedad', 'Niños'],
      rating: 4.8,
      reviews: 203,
      image: 'https://randomuser.me/api/portraits/men/45.jpg',
      available: false,
      priceAmount: 65,
      priceCurrency: '€',
      pricePerSession: '/50min',
      languages: ['🇪🇸', '🇬🇧'],
      verified: true
    }
  ]);

  filteredDoctors = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const activeFilters = this.filterChips().filter(f => f.active);
    
    let results = this.doctors();
    
    // Filter by search query
    if (query) {
      results = results.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.specialty.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by languages
    if (this.selectedLanguages().length > 0) {
      results = results.filter(doc => 
        this.selectedLanguages().some(lang => doc.languages.includes(lang))
      );
    }

    // Filter by price range
    const priceFilter = this.selectedPriceRange();
    results = results.filter(doc => 
      doc.priceAmount >= priceFilter.min && doc.priceAmount <= priceFilter.max
    );
    
    return results;
  });

  resultsCount = computed(() => this.filteredDoctors().length);

  toggleFiltersModal() {
    this.showFiltersModal.update(val => !val);
  }

  toggleFilterChip(chipId: string) {
    const chip = this.filterChips().find(c => c.id === chipId);
    
    if (chip?.type === 'toggle') {
      this.filterChips.update(chips =>
        chips.map(c =>
          c.id === chipId ? { ...c, active: !c.active } : c
        )
      );
    } else if (chip?.type === 'dropdown') {
      if (chipId === 'language') {
        this.showLanguageDropdown.update(val => !val);
        this.showPriceDropdown.set(false);
      }
    } else if (chip?.type === 'range') {
      if (chipId === 'price') {
        this.showPriceDropdown.update(val => !val);
        this.showLanguageDropdown.set(false);
      }
    }
  }

  removeFilterChip(chipId: string) {
    if (chipId === 'language') {
      this.selectedLanguages.set([]);
      this.filterChips.update(chips =>
        chips.map(chip =>
          chip.id === chipId ? { ...chip, active: false } : chip
        )
      );
    } else if (chipId === 'price') {
      this.selectedPriceRange.set({ min: 0, max: 500 });
      this.filterChips.update(chips =>
        chips.map(chip =>
          chip.id === chipId ? { ...chip, active: false } : chip
        )
      );
    }
  }

  toggleLanguage(langFlag: string) {
    this.selectedLanguages.update(langs => {
      if (langs.includes(langFlag)) {
        return langs.filter(l => l !== langFlag);
      } else {
        return [...langs, langFlag];
      }
    });

    // Activate language filter chip
    this.filterChips.update(chips =>
      chips.map(chip =>
        chip.id === 'language' ? { ...chip, active: this.selectedLanguages().length > 0 } : chip
      )
    );
  }

  updatePriceRange(min: number, max: number) {
    this.selectedPriceRange.set({ min, max });
    
    // Activate price filter chip
    this.filterChips.update(chips =>
      chips.map(chip =>
        chip.id === 'price' ? { ...chip, active: true } : chip
      )
    );
  }

  applyPriceFilter() {
    this.showPriceDropdown.set(false);
  }

  closeDropdowns() {
    this.showLanguageDropdown.set(false);
    this.showPriceDropdown.set(false);
  }

  getSelectedLanguagesText(): string {
    const selected = this.selectedLanguages();
    if (selected.length === 0) return 'Idioma';
    if (selected.length === 1) {
      const lang = this.availableLanguages.find(l => selected.includes(l.flag));
      return lang ? `${lang.flag} ${lang.name}` : 'Idioma';
    }
    return `${selected.length} idiomas`;
  }

  getPriceRangeText(): string {
    const range = this.selectedPriceRange();
    if (range.min === 0 && range.max === 500) return 'Precio';
    return `${range.min}€ - ${range.max}€`;
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
