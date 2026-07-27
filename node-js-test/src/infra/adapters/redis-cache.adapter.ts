import { Injectable, Logger } from '@nestjs/common';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { RedisService } from 'src/infra/redis/redis.service';

@Injectable()
export class RedisCacheAdapter extends CacheAdapter {
  private readonly logger = new Logger(RedisCacheAdapter.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);

    if (!cached) {
      this.logger.log(`Cache miss for key "${key}"`);
      return null;
    }

    this.logger.log(`Cache hit for key "${key}"`);
    return JSON.parse(cached) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, payload);
      this.logger.log(`Cache set for key "${key}" (ttl=${ttlSeconds}s)`);
    } else {
      await this.redis.set(key, payload);
      this.logger.log(`Cache set for key "${key}" (no ttl)`);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
    this.logger.log(`Cache invalidated for key "${key}"`);
  }
}
