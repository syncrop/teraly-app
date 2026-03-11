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
  phone?: string | null;
  spokenLanguage?: string | null;
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
  availability?: unknown[];
  blockedDates?: unknown[];
  pricePerSession?: string;
}

type UserDoc = Omit<AppUser, 'createdAt'> & { _id: ObjectId; createdAt: Date };

@Injectable()
export class UsersService {
  constructor(private readonly mongo: MongoService) {}

  async getByUid(uid: string): Promise<AppUser | null> {
    // Primary schema: `uid` field.
    const byUid = (await this.mongo.users().findOne({ uid })) as any | null;
    if (byUid) return this.toAppUser(byUid);

    // Legacy/compat schemas we have seen during migrations:
    // - `_id` equals the Firebase uid (string)
    // - `localId` or `id` equals the Firebase uid
    // - `userId` equals the Firebase uid
    const legacyDoc = (await this.mongo
      .users()
      .findOne({ $or: [{ _id: uid as any }, { localId: uid }, { id: uid }, { userId: uid }] })) as any | null;
    if (!legacyDoc) return null;

    // Best-effort migrate: ensure `uid` exists so future lookups/updates work.
    try {
      if (typeof legacyDoc.uid !== 'string' || legacyDoc.uid !== uid) {
        await this.mongo.users().updateOne(
          { _id: legacyDoc._id },
          { $set: { uid, updatedAt: new Date() } }
        );
        legacyDoc.uid = uid;
      }
    } catch {
      // Ignore migration failures; still return what we can.
      legacyDoc.uid = typeof legacyDoc.uid === 'string' ? legacyDoc.uid : uid;
    }

    return this.toAppUser(legacyDoc);
  }

  async listByRole(role: UserRole): Promise<AppUser[]> {
    const docs = (await this.mongo.users().find({ role }).toArray()) as UserDoc[];
    return docs.map((d) => this.toAppUser(d));
  }

  async upsertMe(uid: string, payload: Partial<AppUser>): Promise<AppUser> {
    const now = new Date();

    const normalizedPayload: Record<string, unknown> = { ...payload };

    // Normalize common profile fields that often come from forms.
    if (Object.prototype.hasOwnProperty.call(normalizedPayload, 'phone')) {
      const raw = (normalizedPayload as any).phone;
      if (raw === null) {
        normalizedPayload['phone'] = null;
      } else if (raw === undefined) {
        // leave as undefined; it will be removed below
      } else {
        const str = String(raw).trim();
        normalizedPayload['phone'] = str.length ? str : null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(normalizedPayload, 'spokenLanguage')) {
      const raw = (normalizedPayload as any).spokenLanguage;
      if (raw === null) {
        normalizedPayload['spokenLanguage'] = null;
      } else if (raw === undefined) {
        // leave as undefined; it will be removed below
      } else {
        const str = String(raw).trim();
        normalizedPayload['spokenLanguage'] = str.length ? str : null;
      }
    }

    const update: Record<string, unknown> = {
      ...normalizedPayload,
      uid,
      updatedAt: now,
    };

    // Do not overwrite existing fields with undefined.
    for (const [key, value] of Object.entries(update)) {
      if (value === undefined) {
        delete update[key];
      }
    }

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

  /**
   * Deletes the user profile and best-effort related data.
   * Designed to be safe for both doctors and clients.
   */
  async deleteAccountData(uid: string): Promise<void> {
    await Promise.all([
      this.mongo.users().deleteOne({ uid }),
      this.mongo.appointments().deleteMany({ $or: [{ clientId: uid }, { doctorId: uid }] }),
      this.mongo.favorites().deleteMany({ $or: [{ userId: uid }, { doctorId: uid }] }),
      this.mongo.reviews().deleteMany({ $or: [{ clientId: uid }, { doctorId: uid }] }),
    ]);
  }

  private toAppUser(doc: any): AppUser {
    const uid =
      typeof doc?.uid === 'string'
        ? doc.uid
        : typeof doc?._id === 'string'
          ? doc._id
          : String(doc?.uid ?? doc?._id ?? '');

    const rawPhone = doc?.phone;
    const phone =
      rawPhone === null || rawPhone === undefined
        ? null
        : typeof rawPhone === 'string'
          ? rawPhone
          : String(rawPhone);

    const rawSpokenLanguage = doc?.spokenLanguage;
    const spokenLanguage =
      rawSpokenLanguage === null || rawSpokenLanguage === undefined
        ? null
        : typeof rawSpokenLanguage === 'string'
          ? rawSpokenLanguage
          : String(rawSpokenLanguage);

    const createdAtValue = doc?.createdAt;
    const createdAt =
      createdAtValue instanceof Date
        ? createdAtValue.toISOString()
        : typeof createdAtValue === 'string'
          ? createdAtValue
          : createdAtValue
            ? String(createdAtValue)
            : new Date(0).toISOString();

    return {
      uid,
      email: String(doc?.email ?? ''),
      fullName: String(doc?.fullName ?? ''),
      role: (doc?.role as UserRole) ?? 'client',
      createdAt,
      completed: doc?.completed,
      photoURL: doc?.photoURL ?? null,
      phone,
      spokenLanguage,
      specialty: doc?.specialty,
      specialties: doc?.specialties,
      available: doc?.available,
      licenseNumber: doc?.licenseNumber,
      isVerified: doc?.isVerified,
      languages: doc?.languages,
      description: doc?.description,
      experience: doc?.experience,
      ratings: doc?.ratings,
      reviewsCount: doc?.reviewsCount,
      price: doc?.price,
      currency: doc?.currency,
      sessionDuration: doc?.sessionDuration,
      breakTime: doc?.breakTime,
      availability: doc?.availability,
      blockedDates: doc?.blockedDates,
      pricePerSession: doc?.pricePerSession,
    };
  }
}
