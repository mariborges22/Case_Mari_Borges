import Redis from 'ioredis';
import { ICacheService } from '../../domain/interfaces';

export class RedisCacheService implements ICacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
