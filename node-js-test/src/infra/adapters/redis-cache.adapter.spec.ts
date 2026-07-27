import { Logger } from '@nestjs/common';
import { RedisService } from 'src/infra/redis/redis.service';
import { RedisCacheAdapter } from './redis-cache.adapter';

describe('RedisCacheAdapter', () => {
  let redis: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'setex' | 'del'>>;
  let adapter: RedisCacheAdapter;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    };
    adapter = new RedisCacheAdapter(redis as unknown as RedisService);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('get', () => {
    it('returns null on a cache miss', async () => {
      redis.get.mockResolvedValue(null);

      const result = await adapter.get('some-key');

      expect(result).toBeNull();
      expect(redis.get).toHaveBeenCalledWith('some-key');
    });

    it('logs a cache miss', async () => {
      redis.get.mockResolvedValue(null);

      await adapter.get('some-key');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cache miss for key "some-key"'),
      );
    });

    it('parses the cached JSON payload back into a plain value', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ a: 1, b: [2, 3] }));

      const result = await adapter.get<{ a: number; b: number[] }>('some-key');

      expect(result).toEqual({ a: 1, b: [2, 3] });
    });

    it('logs a cache hit', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ a: 1 }));

      await adapter.get('some-key');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cache hit for key "some-key"'),
      );
    });
  });

  describe('set', () => {
    it('uses setex with the given TTL when one is provided', async () => {
      await adapter.set('some-key', { a: 1 }, 30);

      expect(redis.setex).toHaveBeenCalledWith(
        'some-key',
        30,
        JSON.stringify({ a: 1 }),
      );
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('uses a plain set with no expiry when no TTL is provided', async () => {
      await adapter.set('some-key', { a: 1 });

      expect(redis.set).toHaveBeenCalledWith(
        'some-key',
        JSON.stringify({ a: 1 }),
      );
      expect(redis.setex).not.toHaveBeenCalled();
    });

    it('logs the key and TTL when a TTL is provided', async () => {
      await adapter.set('some-key', { a: 1 }, 30);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cache set for key "some-key" (ttl=30s)'),
      );
    });

    it('logs the key without a TTL when none is provided', async () => {
      await adapter.set('some-key', { a: 1 });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cache set for key "some-key" (no ttl)'),
      );
    });
  });

  describe('del', () => {
    it('deletes the given key', async () => {
      await adapter.del('some-key');

      expect(redis.del).toHaveBeenCalledWith('some-key');
    });

    it('logs the invalidation', async () => {
      await adapter.del('some-key');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cache invalidated for key "some-key"'),
      );
    });
  });
});
