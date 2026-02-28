import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoService } from '../db/mongo.service';
import { UsersService } from '../users/users.service';
import { CreateDoctorReviewInput, DoctorReview } from './reviews.types';

type ReviewDoc = Omit<DoctorReview, 'createdAt' | 'updatedAt' | 'id'> & {
  _id: string; // `${doctorId}_${clientId}`
  createdAt: Date;
  updatedAt: Date;
};

function toObjectId(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch {
    throw new NotFoundException('Invalid id');
  }
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly mongo: MongoService,
    private readonly users: UsersService
  ) {}

  async listByDoctor(requesterUid: string, doctorId: string): Promise<DoctorReview[]> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    const docs = (await this.mongo
      .reviews()
      .find({ doctorId })
      .sort({ createdAt: -1 })
      .toArray()) as ReviewDoc[];

    return docs.map((d) => this.toReview(d));
  }

  async getMyReviewForDoctor(requesterUid: string, doctorId: string): Promise<DoctorReview | null> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    const id = `${doctorId}_${requesterUid}`;
    const doc = (await this.mongo.reviews().findOne({ _id: id })) as ReviewDoc | null;
    return doc ? this.toReview(doc) : null;
  }

  async canReview(requesterUid: string, doctorId: string, appointmentId: string): Promise<{ canReview: boolean }> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    if (requester.role !== 'client') return { canReview: false };

    const existingId = `${doctorId}_${requesterUid}`;
    const existing = await this.mongo.reviews().findOne({ _id: existingId });
    if (existing) return { canReview: false };

    const appointment = await this.mongo.appointments().findOne({ _id: toObjectId(appointmentId) });
    if (!appointment) return { canReview: false };

    if (appointment.clientId !== requesterUid) return { canReview: false };
    if (appointment.doctorId !== doctorId) return { canReview: false };
    if (appointment.status !== 'completed') return { canReview: false };

    return { canReview: true };
  }

  async create(requesterUid: string, input: CreateDoctorReviewInput): Promise<{ success: boolean }> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    if (requester.role !== 'client') {
      throw new ForbiddenException('Not allowed');
    }

    // Enforce ownership.
    const doctorId = input.doctorId;
    const clientId = requesterUid;

    const { canReview } = await this.canReview(requesterUid, doctorId, input.appointmentId);
    if (!canReview) {
      throw new ForbiddenException('Cannot review');
    }

    const now = new Date();
    const id = `${doctorId}_${clientId}`;

    const doc: ReviewDoc = {
      _id: id,
      doctorId,
      clientId,
      appointmentId: input.appointmentId,
      rating: Number(input.rating),
      comment: String(input.comment ?? ''),
      clientName: String(input.clientName ?? 'Usuario'),
      clientAvatar: input.clientAvatar ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await this.mongo.reviews().insertOne(doc);
    return { success: true };
  }

  private toReview(doc: ReviewDoc): DoctorReview {
    return {
      id: doc._id,
      doctorId: doc.doctorId,
      clientId: doc.clientId,
      appointmentId: doc.appointmentId,
      rating: doc.rating,
      comment: doc.comment,
      clientName: doc.clientName,
      clientAvatar: doc.clientAvatar ?? null,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
    };
  }
}
