package part_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/application/service"
	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/part"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/testsupport"
)

func intPtr(v int) *int { return &v }

func TestUpdateUseCase(t *testing.T) {
	t.Run("applies an explicit zero value instead of skipping it", func(t *testing.T) {
		existing := &entity.Part{
			BaseEntity:   entity.BaseEntity{ID: "part-1"},
			CompanyID:    "company-1",
			CurrentStock: 15,
			MinimumStock: 20,
		}
		repo := &testsupport.FakePartRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, id, companyID string) (*entity.Part, error) {
				return existing, nil
			},
			UpdateFn: func(_ context.Context, p *entity.Part) (*entity.Part, error) {
				return p, nil
			},
		}
		cache := &testsupport.FakeCacheAdapter{}

		uc := part.NewUpdateUseCase(repo, cache)
		updated, err := uc.Execute(context.Background(), part.UpdateInput{
			ID:           "part-1",
			CompanyID:    "company-1",
			CurrentStock: intPtr(0),
		})

		require.NoError(t, err)
		assert.Equal(t, 0, updated.CurrentStock)
		assert.Equal(t, 20, updated.MinimumStock)
		assert.Equal(t, []string{service.CacheKeyFor("company-1")}, cache.DelCalls)
	})

	t.Run("leaves fields untouched when not provided", func(t *testing.T) {
		existing := &entity.Part{
			BaseEntity:   entity.BaseEntity{ID: "part-1"},
			CompanyID:    "company-1",
			Name:         "Original",
			CurrentStock: 15,
		}
		repo := &testsupport.FakePartRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, _, _ string) (*entity.Part, error) {
				return existing, nil
			},
			UpdateFn: func(_ context.Context, p *entity.Part) (*entity.Part, error) {
				return p, nil
			},
		}

		uc := part.NewUpdateUseCase(repo, &testsupport.FakeCacheAdapter{})
		updated, err := uc.Execute(context.Background(), part.UpdateInput{ID: "part-1", CompanyID: "company-1"})

		require.NoError(t, err)
		assert.Equal(t, "Original", updated.Name)
		assert.Equal(t, 15, updated.CurrentStock)
	})

	t.Run("returns NotFound for a part belonging to a different company (cross-tenant isolation)", func(t *testing.T) {
		repo := &testsupport.FakePartRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, _, _ string) (*entity.Part, error) {
				return nil, nil
			},
		}

		uc := part.NewUpdateUseCase(repo, &testsupport.FakeCacheAdapter{})
		updated, err := uc.Execute(context.Background(), part.UpdateInput{ID: "part-1", CompanyID: "company-2"})

		assert.Nil(t, updated)
		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindNotFound, appErr.Kind)
	})
}
