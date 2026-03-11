import { BlockedDate, DaySchedule } from './availability.model';

export type UserRole = 'client' | 'doctor' | null;

export interface AppUser {
  uid: string;
  email: string;
  fullName: string;
  role: 'client' | 'doctor';
  createdAt: any;
  completed?: boolean;
  photoURL?: string;
  phone?: string | null;
  spokenLanguage?: string | null;
  // Campos para doctores
  specialty?: string;
  specialties?: string[];
  available?: boolean;
  licenseNumber?: string;
  isVerified?: boolean;
  languages?: string[];
  description?: string;
  experience?: number;
  ratings?: number;
  reviewsCount?: number;
  price?: number;
  currency?: string;
  sessionDuration?: number;
  breakTime?: number;
  availability?: DaySchedule[];
  blockedDates?: BlockedDate[];
  pricePerSession?: string;
}
