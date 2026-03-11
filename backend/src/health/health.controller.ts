import { Controller, Get } from '@nestjs/common';
import { MongoService } from '../db/mongo.service';

@Controller('health')
export class HealthController {
  constructor(private readonly mongo: MongoService) {}

  @Get()
  async getHealth() {
    const db = await this.mongo.ping();
    return { ok: true, db };
  }
}
