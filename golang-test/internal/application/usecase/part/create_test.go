package part_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mateh3007/karhub/golang-test/internal/application/service"
	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/part"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/testsupport"
)

func TestCreateUseCase(t *testing.T) {
	t.Run("creates the part scoped to the caller's company and invalidates its restock-priorities cache entry", func(t *testing.T) {
		repo := &testsupport.FakePartRepository{
			CreateFn: func(_ context.Context, p *entity.Part) (*entity.Part, error) {
				return p, nil
			},
		}
		cache := &testsupport.FakeCacheAdapter{}

		uc := part.NewCreateUseCase(repo, cache)
		created, err := uc.Execute(context.Background(), part.CreateInput{
			Name:      "Filtro de Oleo X",
			Category:  "engine",
			CompanyID: "company-1",
		})

		require.NoError(t, err)
		assert.Equal(t, "company-1", created.CompanyID)
		assert.NotEmpty(t, created.ID)
		assert.Equal(t, []string{service.CacheKeyFor("company-1")}, cache.DelCalls)
	})

	t.Run("propagates a repository error without touching the cache", func(t *testing.T) {
		repo := &testsupport.FakePartRepository{
			CreateFn: func(_ context.Context, _ *entity.Part) (*entity.Part, error) {
				return nil, assert.AnError
			},
		}
		cache := &testsupport.FakeCacheAdapter{}

		uc := part.NewCreateUseCase(repo, cache)
		created, err := uc.Execute(context.Background(), part.CreateInput{CompanyID: "company-1"})

		assert.Nil(t, created)
		assert.ErrorIs(t, err, assert.AnError)
		assert.Empty(t, cache.DelCalls)
	})
}
