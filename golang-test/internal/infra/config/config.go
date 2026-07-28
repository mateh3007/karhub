// Package config loads runtime configuration from environment variables,
// mirroring node-js-test's .env.example one-for-one so the two backends
// stay operationally interchangeable.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port         string
	DatabaseURL  string
	JWTSecret    string
	JWTExpiresIn time.Duration
	RedisURL     string

	RestockPrioritiesCacheTTL time.Duration

	ThrottleTTL        time.Duration
	ThrottleLimit      int
	AuthThrottleTTL    time.Duration
	AuthThrottleLimit  int

	CORSOrigins []string
}

func Load() (*Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	jwtExpiresIn, err := parseFlexibleDuration(getEnv("JWT_EXPIRES_IN", "1d"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRES_IN: %w", err)
	}

	restockTTLSeconds, err := strconv.Atoi(getEnv("RESTOCK_PRIORITIES_CACHE_TTL_SECONDS", "30"))
	if err != nil {
		return nil, fmt.Errorf("invalid RESTOCK_PRIORITIES_CACHE_TTL_SECONDS: %w", err)
	}

	throttleTTLMs, err := strconv.Atoi(getEnv("THROTTLE_TTL_MS", "60000"))
	if err != nil {
		return nil, fmt.Errorf("invalid THROTTLE_TTL_MS: %w", err)
	}

	throttleLimit, err := strconv.Atoi(getEnv("THROTTLE_LIMIT", "100"))
	if err != nil {
		return nil, fmt.Errorf("invalid THROTTLE_LIMIT: %w", err)
	}

	corsOrigin := getEnv("CORS_ORIGIN", "http://localhost:5173")

	return &Config{
		Port:                      getEnv("PORT", "8080"),
		DatabaseURL:               databaseURL,
		JWTSecret:                 jwtSecret,
		JWTExpiresIn:              jwtExpiresIn,
		RedisURL:                  getEnv("REDIS_URL", "redis://localhost:6379"),
		RestockPrioritiesCacheTTL: time.Duration(restockTTLSeconds) * time.Second,
		ThrottleTTL:               time.Duration(throttleTTLMs) * time.Millisecond,
		ThrottleLimit:             throttleLimit,
		// Matches the Node AuthController's @Throttle override — not
		// environment-configurable there either, so kept as a constant here too.
		AuthThrottleTTL:   60 * time.Second,
		AuthThrottleLimit: 20,
		CORSOrigins:       strings.Split(corsOrigin, ","),
	}, nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// parseFlexibleDuration supports the "1d"-style shorthand used by
// node-js-test's JWT_EXPIRES_IN (via the jsonwebtoken/ms package), which
// Go's time.ParseDuration doesn't understand on its own (no day unit).
func parseFlexibleDuration(s string) (time.Duration, error) {
	if strings.HasSuffix(s, "d") {
		days, err := strconv.Atoi(strings.TrimSuffix(s, "d"))
		if err != nil {
			return 0, err
		}
		return time.Duration(days) * 24 * time.Hour, nil
	}
	return time.ParseDuration(s)
}
