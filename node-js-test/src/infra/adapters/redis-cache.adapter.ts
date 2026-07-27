import { Injectable } from '@nestjs/common';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { RedisService } from 'src/infra/redis/redis.service';

@Injectable()
export class RedisCacheAdapter extends CacheAdapter {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, payload);
    } else {
      await this.redis.set(key, payload);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
