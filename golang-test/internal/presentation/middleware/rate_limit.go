// Package middleware's rate limiter is a hand-rolled per-IP token bucket
// (golang.org/x/time/rate) — there's no NestJS-Throttler equivalent in the
// Go ecosystem, so this plays the same role node-js-test's @nestjs/throttler
// setup does (ADR 0015): a global limit applied to every route, and a
// stricter one on the auth group. It's a token bucket, not a fixed window
// like Nest's default storage, and — same disclosed limitation as the Node
// side — in-memory per-process, not shared across instances.
package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type RateLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	limit    rate.Limit
	burst    int
}

// NewRateLimiter allows up to maxRequests per window, per client IP.
func NewRateLimiter(maxRequests int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		limit:    rate.Limit(float64(maxRequests) / window.Seconds()),
		burst:    maxRequests,
	}
}

func (rl *RateLimiter) limiterFor(key string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.limiters[key]
	if !exists {
		limiter = rate.NewLimiter(rl.limit, rl.burst)
		rl.limiters[key] = limiter
	}
	return limiter
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !rl.limiterFor(c.ClientIP()).Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"message": "ThrottlerException: Too Many Requests"})
			return
		}
		c.Next()
	}
}
