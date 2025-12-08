/**
 * Represents a doctor/specialist profile
 */
export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  image: string;
  availability: string;
  price: string;
}
