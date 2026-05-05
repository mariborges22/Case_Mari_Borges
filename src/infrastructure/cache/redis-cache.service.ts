import Redis from 'ioredis';
import { ICacheService } from '../../domain/interfaces';
import { logger } from '../../shared/logger';
import { redisCacheRequestsTotal } from '../http/middleware/metrics';

export class RedisCacheService implements ICacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.redis.on('connect', () => logger.info('Redis connected'));
    this.redis.on('error', (err) => logger.error('Redis connection error', { err }));
  }

  async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    const value = await this.redis.get(key);
    
    // Tracking Hit/Miss
    redisCacheRequestsTotal.inc({ result: value ? 'hit' : 'miss' });
    
    return value;
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
