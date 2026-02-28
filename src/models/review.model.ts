export interface DoctorReview {
  /** Firestore document id: `${doctorId}_${clientId}` */
  id: string;

  doctorId: string;
  clientId: string;
  appointmentId: string;

  rating: number; // 1-5
  comment: string;

  clientName: string;
  clientAvatar?: string | null;

  createdAt: Date;
  updatedAt: Date;
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
