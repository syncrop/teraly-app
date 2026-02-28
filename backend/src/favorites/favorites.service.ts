import { ForbiddenException, Injectable } from '@nestjs/common';
import { MongoService } from '../db/mongo.service';
import { UsersService } from '../users/users.service';

type FavoriteDoc = {
  _id: string; // `${userId}_${doctorId}`
  userId: string;
  doctorId: string;
  createdAt: Date;
};

@Injectable()
export class FavoritesService {
  constructor(
    private readonly mongo: MongoService,
    private readonly users: UsersService
  ) {}

  async addFavorite(requesterUid: string, doctorId: string): Promise<{ success: boolean }> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    // Only clients can favorite doctors.
    if (requester.role !== 'client') {
      throw new ForbiddenException('Not allowed');
    }

    const docId = `${requesterUid}_${doctorId}`;

    const insert: FavoriteDoc = {
      _id: docId,
      userId: requesterUid,
      doctorId,
      createdAt: new Date(),
    };

    await this.mongo.favorites().updateOne({ _id: docId }, { $setOnInsert: insert }, { upsert: true });
    return { success: true };
  }

  async removeFavorite(requesterUid: string, doctorId: string): Promise<{ success: boolean }> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    if (requester.role !== 'client') {
      throw new ForbiddenException('Not allowed');
    }

    const docId = `${requesterUid}_${doctorId}`;
    const res = await this.mongo.favorites().deleteOne({ _id: docId });
    return { success: res.deletedCount === 1 };
  }

  async isFavorite(requesterUid: string, doctorId: string): Promise<{ isFavorite: boolean }> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    const docId = `${requesterUid}_${doctorId}`;
    const doc = await this.mongo.favorites().findOne({ _id: docId });
    return { isFavorite: !!doc };
  }

  async listMyFavorites(requesterUid: string): Promise<{ doctorIds: string[] }> {
    const requester = await this.users.getByUid(requesterUid);
    if (!requester) throw new ForbiddenException('Missing profile');

    const docs = (await this.mongo
      .favorites()
      .find({ userId: requesterUid })
      .project({ doctorId: 1 })
      .toArray()) as Array<Pick<FavoriteDoc, 'doctorId'>>;

    return { doctorIds: docs.map((d) => d.doctorId) };
  }
}
