export interface Doctor {
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

export interface AvailableDay {
  date: string;
  dayName: string;
  dayNumber: string;
  available: boolean;
}

export interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
}
