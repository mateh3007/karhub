package part_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mateh3007/karhub/golang-test/internal/application/service"
	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/part"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/testsupport"
)

func TestGetRestockPrioritiesUseCase(t *testing.T) {
	t.Run("on a cache miss, computes needing-restock parts sorted by urgency, caches them, and paginates", func(t *testing.T) {
		urgent := &entity.Part{
			Name: "Urgent", CompanyID: "company-1",
			CurrentStock: 0, MinimumStock: 20, AverageDailySales: 4, LeadTimeDays: 5, CriticalityLevel: 5,
		}
		fine := &entity.Part{
			Name: "Fine", CompanyID: "company-1",
			CurrentStock: 1000, MinimumStock: 5, AverageDailySales: 1, LeadTimeDays: 1, CriticalityLevel: 1,
		}

		var findByCompanyCalls int
		var setKey string
		var setTTL time.Duration
		var setValue any

		repo := &testsupport.FakePartRepository{
			FindByCompanyIDFn: func(_ context.Context, companyID string) ([]*entity.Part, error) {
				findByCompanyCalls++
				assert.Equal(t, "company-1", companyID)
				return []*entity.Part{fine, urgent}, nil
			},
		}
		cache := &testsupport.FakeCacheAdapter{
			SetFn: func(_ context.Context, key string, value any, ttl time.Duration) error {
				setKey, setTTL, setValue = key, ttl, value
				return nil
			},
		}

		uc := part.NewGetRestockPrioritiesUseCase(repo, service.NewPartPriorityService(), cache, 30*time.Second)
		result, err := uc.Execute(context.Background(), part.GetRestockPrioritiesInput{CompanyID: "company-1", Page: 1, Limit: 20})

		require.NoError(t, err)
		require.Len(t, result.Data, 1)
		assert.Equal(t, "Urgent", result.Data[0].Name)
		assert.Equal(t, 1, result.Total)
		assert.Equal(t, 1, findByCompanyCalls)
		assert.Equal(t, service.CacheKeyFor("company-1"), setKey)
		assert.Equal(t, 30*time.Second, setTTL)
		assert.Equal(t, []*entity.Part{urgent}, setValue)
	})

	t.Run("on a cache hit, skips recomputation entirely and paginates the cached list", func(t *testing.T) {
		cached := []*entity.Part{
			{Name: "A", CompanyID: "company-1"},
			{Name: "B", CompanyID: "company-1"},
			{Name: "C", CompanyID: "company-1"},
		}

		repo := &testsupport.FakePartRepository{
			FindByCompanyIDFn: func(_ context.Context, _ string) ([]*entity.Part, error) {
				t.Fatal("FindByCompanyID should not be called on a cache hit")
				return nil, nil
			},
		}
		cache := &testsupport.FakeCacheAdapter{
			GetFn: func(_ context.Context, key string, dest any) (bool, error) {
				assert.Equal(t, service.CacheKeyFor("company-1"), key)
				b, err := json.Marshal(cached)
				require.NoError(t, err)
				return true, json.Unmarshal(b, dest)
			},
		}

		uc := part.NewGetRestockPrioritiesUseCase(repo, service.NewPartPriorityService(), cache, 30*time.Second)
		result, err := uc.Execute(context.Background(), part.GetRestockPrioritiesInput{CompanyID: "company-1", Page: 1, Limit: 2})

		require.NoError(t, err)
		assert.Equal(t, 3, result.Total)
		assert.Equal(t, 2, result.TotalPages)
		require.Len(t, result.Data, 2)
		assert.Equal(t, "A", result.Data[0].Name)
		assert.Equal(t, "B", result.Data[1].Name)
	})

	t.Run("returns an empty (not nil) data slice for a page past the end", func(t *testing.T) {
		repo := &testsupport.FakePartRepository{
			FindByCompanyIDFn: func(_ context.Context, _ string) ([]*entity.Part, error) {
				return []*entity.Part{{Name: "Only", CompanyID: "company-1", CurrentStock: 0, MinimumStock: 10, AverageDailySales: 1, LeadTimeDays: 1, CriticalityLevel: 1}}, nil
			},
		}
		cache := &testsupport.FakeCacheAdapter{}

		uc := part.NewGetRestockPrioritiesUseCase(repo, service.NewPartPriorityService(), cache, 30*time.Second)
		result, err := uc.Execute(context.Background(), part.GetRestockPrioritiesInput{CompanyID: "company-1", Page: 5, Limit: 20})

		require.NoError(t, err)
		assert.NotNil(t, result.Data)
		assert.Empty(t, result.Data)
		assert.Equal(t, 1, result.Total)
	})
}
