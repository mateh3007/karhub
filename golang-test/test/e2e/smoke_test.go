// Package e2e_test drives the full stack (real Postgres + real Redis, the
// actual Gin router) through an httptest.Server, the same way node-js-test's
// e2e suite exercises its Nest app. Skips itself if the local dev infra
// (docker compose's postgres/redis on localhost) isn't reachable, so
// `go test ./...` still passes in environments without Docker.
package e2e_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/infra/config"
	"github.com/mateh3007/karhub/golang-test/internal/infra/postgres"
	"github.com/mateh3007/karhub/golang-test/internal/infra/redis"
	"github.com/mateh3007/karhub/golang-test/internal/presentation"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/dto"
)

func setupServer(t *testing.T) (*httptest.Server, func()) {
	t.Helper()

	cfg := &config.Config{
		Port:                      "0",
		DatabaseURL:               "postgres://karhub:karhub@localhost:5432/karhub_go?sslmode=disable",
		JWTSecret:                 "e2e-test-secret",
		JWTExpiresIn:              time.Hour,
		RedisURL:                  "redis://localhost:6379",
		RestockPrioritiesCacheTTL: 30 * time.Second,
		ThrottleTTL:               60 * time.Second,
		ThrottleLimit:             100,
		AuthThrottleTTL:           60 * time.Second,
		AuthThrottleLimit:         20,
		CORSOrigins:               []string{"*"},
	}

	ctx := context.Background()

	pool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		t.Skipf("postgres not reachable at %s, skipping e2e suite: %v", cfg.DatabaseURL, err)
	}

	redisClient, err := redis.NewClient(ctx, cfg.RedisURL)
	if err != nil {
		pool.Close()
		t.Skipf("redis not reachable at %s, skipping e2e suite: %v", cfg.RedisURL, err)
	}

	if _, err := pool.Exec(ctx, "TRUNCATE parts, users, companies"); err != nil {
		pool.Close()
		_ = redisClient.Close()
		t.Fatalf("truncating karhub_go tables: %v", err)
	}
	if err := redisClient.FlushDB(ctx).Err(); err != nil {
		pool.Close()
		_ = redisClient.Close()
		t.Fatalf("flushing redis: %v", err)
	}

	router := presentation.NewRouter(cfg, pool, redisClient)
	srv := httptest.NewServer(router)

	cleanup := func() {
		srv.Close()
		pool.Close()
		_ = redisClient.Close()
	}

	return srv, cleanup
}

func doJSON(t *testing.T, method, url, token string, body any, out any) *http.Response {
	t.Helper()

	var reqBody *bytes.Buffer
	if body != nil {
		b, err := json.Marshal(body)
		require.NoError(t, err)
		reqBody = bytes.NewBuffer(b)
	} else {
		reqBody = bytes.NewBuffer(nil)
	}

	req, err := http.NewRequest(method, url, reqBody)
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	if out != nil {
		defer resp.Body.Close()
		require.NoError(t, json.NewDecoder(resp.Body).Decode(out))
	}

	return resp
}

func registerCompany(t *testing.T, baseURL, label string) (dto.RegisterResponse, string) {
	t.Helper()

	suffix := uuid.NewString()[:8]
	req := dto.RegisterRequest{
		CorporateName: label + " Corp",
		TradeName:     label,
		CNPJ:          fmt.Sprintf("%014d", time.Now().UnixNano()%1e14),
		Phone:         "+55 11 90000-0000",
		ContactEmail:  fmt.Sprintf("admin-%s-%s@example.test", label, suffix),
		AdminName:     "Admin " + label,
		AdminPassword: "s3cret-password",
	}

	var registerOut dto.RegisterResponse
	resp := doJSON(t, http.MethodPost, baseURL+"/auth/register", "", req, &registerOut)
	require.Equal(t, http.StatusCreated, resp.StatusCode, "register %s", label)

	var loginOut dto.LoginResponse
	resp = doJSON(t, http.MethodPost, baseURL+"/auth/login", "", dto.LoginRequest{
		Email:    req.ContactEmail,
		Password: req.AdminPassword,
	}, &loginOut)
	require.Equal(t, http.StatusOK, resp.StatusCode, "login %s", label)
	require.NotEmpty(t, loginOut.AccessToken)

	return registerOut, loginOut.AccessToken
}

// TestGoldenPath mirrors the manual QA already run against the Node
// backend: register -> login -> create a part that needs restocking -> it
// shows up in /restock/priorities with the right numbers -> cross-tenant
// isolation (company B never sees company A's data, 404 not 403) -> a
// non-admin user is blocked (403) from admin-only routes -> the auth
// rate limiter kicks in past its threshold.
func TestGoldenPath(t *testing.T) {
	srv, cleanup := setupServer(t)
	defer cleanup()
	baseURL := srv.URL

	companyA, tokenA := registerCompany(t, baseURL, "Acme")
	_, tokenB := registerCompany(t, baseURL, "Globex")

	t.Run("create a part that needs restocking and see it prioritized", func(t *testing.T) {
		createReq := dto.CreatePartRequest{
			Name:              "Filtro de Oleo X",
			Category:          "engine",
			CurrentStock:      15,
			MinimumStock:      20,
			AverageDailySales: 4,
			LeadTimeDays:      5,
			UnitCost:          18.5,
			CriticalityLevel:  3,
		}
		var created dto.PartResponse
		resp := doJSON(t, http.MethodPost, baseURL+"/parts", tokenA, createReq, &created)
		require.Equal(t, http.StatusCreated, resp.StatusCode)
		assert.Equal(t, companyA.Company.ID, created.CompanyID)

		var priorities dto.RestockPrioritiesResponse
		resp = doJSON(t, http.MethodGet, baseURL+"/restock/priorities", tokenA, nil, &priorities)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		require.Len(t, priorities.Priorities, 1)
		item := priorities.Priorities[0]
		assert.Equal(t, created.ID, item.PartID)
		// projectedStock = 15 - 4*5 = -5, urgencyScore = (20 - (-5)) * 3 = 75
		assert.Equal(t, -5.0, item.ProjectedStock)
		assert.Equal(t, 75.0, item.UrgencyScore)

		t.Run("cross-tenant isolation: company B sees none of company A's parts, users or company record", func(t *testing.T) {
			var partsB dto.PartsPageResponse
			resp := doJSON(t, http.MethodGet, baseURL+"/parts", tokenB, nil, &partsB)
			require.Equal(t, http.StatusOK, resp.StatusCode)
			assert.Empty(t, partsB.Data)

			resp = doJSON(t, http.MethodGet, baseURL+"/parts/"+created.ID, tokenB, nil, nil)
			assert.Equal(t, http.StatusNotFound, resp.StatusCode)

			resp = doJSON(t, http.MethodGet, baseURL+"/companies/"+companyA.Company.ID, tokenB, nil, nil)
			assert.Equal(t, http.StatusNotFound, resp.StatusCode)

			resp = doJSON(t, http.MethodGet, baseURL+"/users/"+companyA.User.ID, tokenB, nil, nil)
			assert.Equal(t, http.StatusNotFound, resp.StatusCode)

			var priorityB dto.RestockPrioritiesResponse
			resp = doJSON(t, http.MethodGet, baseURL+"/restock/priorities", tokenB, nil, &priorityB)
			require.Equal(t, http.StatusOK, resp.StatusCode)
			assert.Empty(t, priorityB.Priorities)
		})
	})

	t.Run("a USER role is blocked (403) from admin-only routes", func(t *testing.T) {
		var createdUser dto.UserResponse
		resp := doJSON(t, http.MethodPost, baseURL+"/users", tokenA, dto.CreateUserRequest{
			Name:     "Regular User",
			Email:    "regular-" + uuid.NewString()[:8] + "@example.test",
			Password: "s3cret-password",
			Role:     entity.RoleUser,
		}, &createdUser)
		require.Equal(t, http.StatusCreated, resp.StatusCode)

		var loginOut dto.LoginResponse
		resp = doJSON(t, http.MethodPost, baseURL+"/auth/login", "", dto.LoginRequest{
			Email:    createdUser.Email,
			Password: "s3cret-password",
		}, &loginOut)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		userToken := loginOut.AccessToken

		resp = doJSON(t, http.MethodPost, baseURL+"/parts", userToken, dto.CreatePartRequest{
			Name: "Should Be Blocked", Category: "misc", CriticalityLevel: 1,
		}, nil)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)

		// Positive control: the same route works for the admin token.
		resp = doJSON(t, http.MethodPost, baseURL+"/parts", tokenA, dto.CreatePartRequest{
			Name: "Admin Can Create", Category: "misc", CriticalityLevel: 1,
		}, nil)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		// Reading is open to any authenticated role.
		resp = doJSON(t, http.MethodGet, baseURL+"/parts", userToken, nil, nil)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})

	t.Run("the auth rate limiter returns 429 once its threshold is exceeded", func(t *testing.T) {
		var sawTooManyRequests bool
		for i := 0; i < 25; i++ {
			resp := doJSON(t, http.MethodPost, baseURL+"/auth/login", "", dto.LoginRequest{
				Email:    "nobody@example.test",
				Password: "wrong-password",
			}, nil)
			if resp.StatusCode == http.StatusTooManyRequests {
				sawTooManyRequests = true
				break
			}
			assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		}

		assert.True(t, sawTooManyRequests, "expected a 429 after exceeding the auth rate limit")
	})
}
