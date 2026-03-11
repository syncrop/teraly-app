import { Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Collection, Db, MongoClient } from 'mongodb';

export type FavoritesDoc = {
  _id: string;
  userId: string;
  doctorId: string;
  createdAt: Date;
};

export type ReviewsDoc = {
  _id: string;
  doctorId: string;
  clientId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  clientName: string;
  clientAvatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name);
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async onModuleInit(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    const allowNoDb = process.env.ALLOW_NO_DB === 'true';
    if (!uri) {
      if (allowNoDb) {
        this.logger.warn('MONGODB_URI not set; running with ALLOW_NO_DB=true');
        return;
      }
      throw new Error('Missing env var: MONGODB_URI');
    }

    const dbName = process.env.MONGODB_DB || 'teraly';

    this.client = new MongoClient(uri);
    try {
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.logger.log(`MongoDB connected (db=${dbName})`);
    } catch (err) {
      if (allowNoDb) {
        this.logger.warn('MongoDB connection failed; continuing with ALLOW_NO_DB=true');
        this.logger.warn(String(err));
        await this.client.close().catch(() => undefined);
        this.client = null;
        this.db = null;
        return;
      }
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.close().catch(() => undefined);
    this.client = null;
    this.db = null;
  }

  private getDb(): Db {
    if (!this.db) {
      throw new ServiceUnavailableException('Database not configured');
    }
    return this.db;
  }

  async ping(): Promise<boolean> {
    if (!this.db) return false;
    try {
      await this.db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  users(): Collection {
    return this.getDb().collection('users');
  }

  appointments(): Collection {
    return this.getDb().collection('appointments');
  }

  favorites(): Collection<FavoritesDoc> {
    return this.getDb().collection<FavoritesDoc>('favorites');
  }

  reviews(): Collection<ReviewsDoc> {
    return this.getDb().collection<ReviewsDoc>('reviews');
  }
}
