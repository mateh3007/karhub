// Package cache mirrors node-js-test's generic CacheAdapter port (ADR 0011):
// a cache-technology-agnostic interface that domain/application code depends
// on, with the concrete Redis implementation living in infra/redis instead.
package cache

import (
	"context"
	"time"
)

type Adapter interface {
	// Get unmarshals the cached value (if any) into dest (a pointer) and
	// reports whether a value was found.
	Get(ctx context.Context, key string, dest any) (bool, error)
	Set(ctx context.Context, key string, value any, ttl time.Duration) error
	Del(ctx context.Context, key string) error
}
