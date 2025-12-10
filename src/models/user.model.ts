export type UserRole = 'client' | 'doctor' | null;

export interface AppUser {
  uid: string;
  email: string;
  fullName: string;
  role: 'client' | 'doctor';
  createdAt: any;
  completed?: boolean;
  photoURL?: string;
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
  pricePerSession?: string;
}
