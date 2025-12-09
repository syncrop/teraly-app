import { ChangeDetectionStrategy, Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../services/toast.service';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  specialties: string[];
  description: string;
  rating: number;
  patients: string;
  experience: string;
  price: number;
  currency: string;
  image: string;
  languages: string[];
  verified: boolean;
}

interface AvailableDay {
  date: string;
  dayName: string;
  dayNumber: string;
  available: boolean;
}

interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorDetailComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  @ViewChild('availabilitySection') availabilitySection?: ElementRef;

  isFavorite = signal(false);
  showFullDescription = signal(false);
  selectedDay = signal<string | null>(null);
  selectedTimeSlot = signal<string | null>(null);

  // Available days
  availableDays = signal<AvailableDay[]>([
    { date: '24', dayName: 'Hoy', dayNumber: '24', available: true },
    { date: '25', dayName: 'Mie', dayNumber: '25', available: false },
    { date: '26', dayName: 'Jue', dayNumber: '26', available: true },
    { date: '27', dayName: 'Vie', dayNumber: '27', available: false }
  ]);

  // Time slots for selected day
  timeSlots = signal<string[]>(['16:30', '17:30', '19:00']);

  // Reviews
  reviews = signal<Review[]>([
    {
      id: 1,
      name: 'Marta G.',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      rating: 5,
      comment: 'El Dr. Javier me ayudó muchísimo con mi ansiedad social. Desde la segunda sesión noté cambios...'
    }
  ]);

  // Mock doctor data
  doctor = signal<Doctor>({
    id: 1,
    name: 'Dr. Javier Perez',
    specialty: 'Psicólogo Clínico',
    specialties: ['Ansiedad', 'Depresión', 'Autoestima', 'Burnout'],
    description: 'Especialista en ansiedad y gestión del estrés con enfoque integrador. Mi objetivo es proporcionarte herramientas prácticas desde la primera sesión. Tengo experiencia trabajando con expatriados y adaptación cultural.',
    rating: 4.9,
    patients: '1.2k+',
    experience: '8 años',
    price: 50,
    currency: '€',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    languages: ['🇪🇸', '🇬🇧'],
    verified: true
  });

  goBack() {
    this.router.navigate(['/search']);
  }

  toggleFavorite() {
    this.isFavorite.update(val => !val);
  }

  toggleDescription() {
    this.showFullDescription.update(val => !val);
  }

  bookAppointment() {
    // Validate that day and time are selected
    if (!this.selectedDay() || !this.selectedTimeSlot()) {
      // Scroll to availability section
      if (this.availabilitySection) {
        this.availabilitySection.nativeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      // Show error toast
      this.toastService.show(
        'Por favor, selecciona un día y una hora para tu cita',
        'error'
      );
      return;
    }
    
    // TODO: Navigate to booking confirmation page
    console.log('Book appointment with:', this.doctor().name, 'on', this.selectedDay(), 'at', this.selectedTimeSlot());
    this.toastService.show(
      'Procesando tu reserva...',
      'info'
    );
  }

  sendMessage() {
    // TODO: Open chat/message
    console.log('Send message to:', this.doctor().name);
  }

  selectDay(date: string) {
    this.selectedDay.set(date);
    // TODO: Load time slots for selected day
  }

  selectTimeSlot(slot: string) {
    this.selectedTimeSlot.set(slot);
  }
}
