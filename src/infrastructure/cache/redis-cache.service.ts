import Redis from 'ioredis';
import { ICacheService } from '../../domain/interfaces';
import { logger } from '../../shared/logger';
import { redisCacheRequestsTotal } from '../http/middleware/metrics';

export class RedisCacheService implements ICacheService {
  private redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    logger.info(`Initializing Redis connection to: ${redisUrl.split('@')[1] || 'localhost'}`);
    
    this.redis = new Redis(redisUrl, {
      tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      family: 4, // Força IPv4 (Resolve o AggregateError no Node 20)
      connectTimeout: 10000, // 10 segundos para desistir
      maxRetriesPerRequest: 1
    });
    
    this.redis.on('connect', () => logger.info('Redis connected to cloud ☁️'));
    this.redis.on('error', (err) => {
      logger.error('Redis connection error', { 
        message: err.message,
        stack: err.stack,
        url: redisUrl.split('@')[1] // Loga apenas o host por segurança
      });
    });
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

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
