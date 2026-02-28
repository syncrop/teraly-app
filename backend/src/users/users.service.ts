import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoService } from '../db/mongo.service';

export type UserRole = 'client' | 'doctor';

export interface AppUser {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  completed?: boolean;
  photoURL?: string | null;
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

type UserDoc = Omit<AppUser, 'createdAt'> & { _id: ObjectId; createdAt: Date };

@Injectable()
export class UsersService {
  constructor(private readonly mongo: MongoService) {}

  async getByUid(uid: string): Promise<AppUser | null> {
    const doc = (await this.mongo.users().findOne({ uid })) as UserDoc | null;
    return doc ? this.toAppUser(doc) : null;
  }

  async listByRole(role: UserRole): Promise<AppUser[]> {
    const docs = (await this.mongo.users().find({ role }).toArray()) as UserDoc[];
    return docs.map((d) => this.toAppUser(d));
  }

  async upsertMe(uid: string, payload: Partial<AppUser>): Promise<AppUser> {
    const now = new Date();

    const update: Record<string, unknown> = {
      ...payload,
      uid,
      updatedAt: now,
    };

    // Prevent callers from forcing createdAt.
    delete update['createdAt'];

    await this.mongo.users().updateOne(
      { uid },
      {
        $set: update,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    const user = await this.getByUid(uid);
    if (!user) {
      throw new Error('Upsert failed');
    }
    return user;
  }

  async updateProfilePicture(uid: string, photoURL: string | null): Promise<void> {
    await this.mongo.users().updateOne(
      { uid },
      {
        $set: { photoURL: photoURL ?? null, updatedAt: new Date() },
      }
    );
  }

  private toAppUser(doc: UserDoc): AppUser {
    return {
      uid: doc.uid,
      email: doc.email,
      fullName: doc.fullName,
      role: doc.role,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      completed: doc.completed,
      photoURL: doc.photoURL ?? null,
      specialty: doc.specialty,
      specialties: doc.specialties,
      available: doc.available,
      licenseNumber: doc.licenseNumber,
      isVerified: doc.isVerified,
      languages: doc.languages,
      description: doc.description,
      experience: doc.experience,
      ratings: doc.ratings,
      reviewsCount: doc.reviewsCount,
      price: doc.price,
      currency: doc.currency,
      pricePerSession: doc.pricePerSession,
    };
  }
}
