import { RedisService } from 'src/infra/redis/redis.service';
import { RedisCacheAdapter } from './redis-cache.adapter';

describe('RedisCacheAdapter', () => {
  let redis: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'setex' | 'del'>>;
  let adapter: RedisCacheAdapter;

  beforeEach(() => {
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    };
    adapter = new RedisCacheAdapter(redis as unknown as RedisService);
  });

  describe('get', () => {
    it('returns null on a cache miss', async () => {
      redis.get.mockResolvedValue(null);

      const result = await adapter.get('some-key');

      expect(result).toBeNull();
      expect(redis.get).toHaveBeenCalledWith('some-key');
    });

    it('parses the cached JSON payload back into a plain value', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ a: 1, b: [2, 3] }));

      const result = await adapter.get<{ a: number; b: number[] }>('some-key');

      expect(result).toEqual({ a: 1, b: [2, 3] });
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
  });

  describe('del', () => {
    it('deletes the given key', async () => {
      await adapter.del('some-key');

      expect(redis.del).toHaveBeenCalledWith('some-key');
    });
  });
});
