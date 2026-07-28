package redis

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/mateh3007/karhub/golang-test/internal/domain/cache"
)

// CacheAdapter implements the domain's generic cache.Adapter port on top of
// Redis — mirrors node-js-test's RedisCacheAdapter (ADR 0011): logs every
// hit/miss/set/invalidate, and is otherwise a thin, entity-agnostic wrapper.
type CacheAdapter struct {
	client *redis.Client
}

func NewCacheAdapter(client *redis.Client) *CacheAdapter {
	return &CacheAdapter{client: client}
}

var _ cache.Adapter = (*CacheAdapter)(nil)

func (a *CacheAdapter) Get(ctx context.Context, key string, dest any) (bool, error) {
	value, err := a.client.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		log.Printf(`Cache miss for key "%s"`, key)
		return false, nil
	}
	if err != nil {
		return false, err
	}

	log.Printf(`Cache hit for key "%s"`, key)
	if err := json.Unmarshal([]byte(value), dest); err != nil {
		return false, err
	}
	return true, nil
}

func (a *CacheAdapter) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	payload, err := json.Marshal(value)
	if err != nil {
		return err
	}

	if err := a.client.Set(ctx, key, payload, ttl).Err(); err != nil {
		return err
	}

	if ttl > 0 {
		log.Printf(`Cache set for key "%s" (ttl=%s)`, key, ttl)
	} else {
		log.Printf(`Cache set for key "%s" (no ttl)`, key)
	}
	return nil
}

func (a *CacheAdapter) Del(ctx context.Context, key string) error {
	if err := a.client.Del(ctx, key).Err(); err != nil {
		return err
	}
	log.Printf(`Cache invalidated for key "%s"`, key)
	return nil
}
