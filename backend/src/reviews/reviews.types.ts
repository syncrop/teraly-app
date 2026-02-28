export interface DoctorReview {
  id: string;
  doctorId: string;
  clientId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  clientName: string;
  clientAvatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoctorReviewInput {
  doctorId: string;
  clientId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  clientName: string;
  clientAvatar?: string | null;
}
