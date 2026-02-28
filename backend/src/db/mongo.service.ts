import { Injectable, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Collection, Db, MongoClient } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async onModuleInit(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      const allowNoDb = process.env.ALLOW_NO_DB === 'true';
      if (allowNoDb) {
        return;
      }
      throw new Error('Missing env var: MONGODB_URI');
    }

    const dbName = process.env.MONGODB_DB || 'teraly';

    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db(dbName);
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

  users(): Collection {
    return this.getDb().collection('users');
  }

  appointments(): Collection {
    return this.getDb().collection('appointments');
  }

  favorites(): Collection {
    return this.getDb().collection('favorites');
  }

  reviews(): Collection {
    return this.getDb().collection('reviews');
  }
}
