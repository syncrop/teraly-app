import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { CurrencySymbolPipe } from '../../shared/pipes/currency-symbol.pipe';
import { AppUser } from '@/models/user.model';
import { LanguagesSelectorComponent, LanguageOption } from '../../shared/languages-selector/languages-selector.component';

interface Doctor {
  id: string;
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
  languageFlags: string[];
  verified: boolean;
}

interface FilterChip {
  id: string;
  label: string;
  icon?: string;
  active: boolean;
  type?: 'toggle' | 'dropdown' | 'range';
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CurrencySymbolPipe, LanguagesSelectorComponent]
})
export class SearchComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  searchQuery = signal('');
  showFiltersModal = signal(false);
  showLanguageDropdown = signal(false);
  showPriceDropdown = signal(false);
  isLoading = signal(true);

  ngOnInit() {
    window.scrollTo(0, 0);
    this.loadDoctors();
  }

  loadDoctors() {
    this.isLoading.set(true);
    this.userService.getDoctors().subscribe({
      next: (users) => {
        console.log('Usuarios obtenidos:', users);
        // Mapear usuarios de Firestore a formato Doctor del componente
        const mappedDoctors = users
          .filter(user => user.completed === true) // Solo mostrar doctores con perfil completo
          .map((user: AppUser) => {
            const languageCodes = this.normalizeLanguageCodes(user.languages);

            return {
            id: user.uid,
            name: user.fullName || 'Doctor',
            specialty: user.specialty || 'Psicología',
            tags: user.specialties || (user.specialty ? [user.specialty] : []),
            rating: user.ratings, // Esto vendría de un campo en el futuro
            reviews: user.reviewsCount || 0, // Esto se calculará en el futuro
            image: user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullName || 'Doctor') + '&background=818cf8&clor=fff&size=200',
            available: true,
            priceAmount: user.price,
            priceCurrency: user.currency || 'EUR',
            pricePerSession: user.pricePerSession,
            languages: languageCodes,
            languageFlags: languageCodes.map((code) => this.getLanguageFlag(code)),
            verified: user.isVerified || false
          };
        });
        
        this.doctors.set(mappedDoctors);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar doctores:', error);
        this.isLoading.set(false);
        // Mantener doctores vacíos en caso de error
        this.doctors.set([]);
      }
    });
  }

  getLanguageFlag(langCode: string): string {
    const flags: Record<string, string> = {
      'es': '🇪🇸',
      'en': '🇬🇧',
      'pl': '🇵🇱',
      'uk': '🇺🇦',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'pt': '🇵🇹',
      'español': '🇪🇸',
      'english': '🇬🇧',
      'polski': '🇵🇱',
      'українська': '🇺🇦'
    };
    return flags[langCode.toLowerCase()] || '🇪🇸';
  }

  private normalizeLanguageCodes(languages: string[] | null | undefined): string[] {
    if (!Array.isArray(languages)) return [];
    return languages
      .map((lang) => (lang ?? '').trim().toLowerCase())
      .filter(Boolean);
  }
  
  filterChips = signal<FilterChip[]>([
    { id: 'language', label: 'Idioma', icon: '🌍', active: false, type: 'dropdown' },
    { id: 'price', label: 'Precio', icon: '💰', active: false, type: 'range' }
  ]);

  readonly availableLanguages: LanguageOption[] = [
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'pl', flag: '🇵🇱', name: 'Polski' },
    { code: 'uk', flag: '🇺🇦', name: 'Українська' },
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'pt', flag: '🇵🇹', name: 'Português' }
  ];

  selectedLanguages = signal<string[]>([]);
  priceRange = signal<{ min: number; max: number }>({ min: 0, max: 500 });
  selectedPriceRange = signal<{ min: number; max: number }>({ min: 0, max: 500 });

  // Doctors list from Firestore
  doctors = signal<Doctor[]>([]);

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
    
    // Filter by languages (codes)
    const selectedLanguageCodes = this.selectedLanguages();
    if (selectedLanguageCodes.length > 0) {
      results = results.filter(doc => selectedLanguageCodes.some(lang => doc.languages.includes(lang)));
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
    this.showFiltersModal.update(val => {
      const next = !val;
      if (!next) {
        this.showLanguageDropdown.set(false);
        this.showPriceDropdown.set(false);
      }
      return next;
    });
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
      this.showLanguageDropdown.set(false);
      this.filterChips.update(chips =>
        chips.map(chip =>
          chip.id === chipId ? { ...chip, active: false } : chip
        )
      );
    } else if (chipId === 'price') {
      this.selectedPriceRange.set({ min: 0, max: 500 });
      this.showPriceDropdown.set(false);
      this.filterChips.update(chips =>
        chips.map(chip =>
          chip.id === chipId ? { ...chip, active: false } : chip
        )
      );
    }
  }

  onSelectedLanguagesChange(codes: string[]): void {
    const normalizedCodes = this.normalizeLanguageCodes(codes);
    this.selectedLanguages.set(normalizedCodes);

    this.filterChips.update(chips =>
      chips.map(chip =>
        chip.id === 'language' ? { ...chip, active: normalizedCodes.length > 0 } : chip
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
      const lang = this.availableLanguages.find(l => l.code === selected[0]);
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

  viewDoctorDetail(doctorId: string) {
    this.router.navigate(['/app/doctor', doctorId]);
  }
}
