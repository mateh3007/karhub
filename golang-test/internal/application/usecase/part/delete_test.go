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

func TestDeleteUseCase(t *testing.T) {
	t.Run("deletes the part and invalidates the restock-priorities cache", func(t *testing.T) {
		existing := &entity.Part{BaseEntity: entity.BaseEntity{ID: "part-1"}, CompanyID: "company-1"}
		var deletedID string
		repo := &testsupport.FakePartRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, _, _ string) (*entity.Part, error) {
				return existing, nil
			},
			DeleteFn: func(_ context.Context, id string) error {
				deletedID = id
				return nil
			},
		}
		cache := &testsupport.FakeCacheAdapter{}

		uc := part.NewDeleteUseCase(repo, cache)
		err := uc.Execute(context.Background(), "part-1", "company-1")

		require.NoError(t, err)
		assert.Equal(t, "part-1", deletedID)
		assert.Equal(t, []string{service.CacheKeyFor("company-1")}, cache.DelCalls)
	})

	t.Run("returns NotFound and never deletes when the part isn't scoped to the caller's company", func(t *testing.T) {
		deleteCalled := false
		repo := &testsupport.FakePartRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, _, _ string) (*entity.Part, error) {
				return nil, nil
			},
			DeleteFn: func(_ context.Context, _ string) error {
				deleteCalled = true
				return nil
			},
		}
		cache := &testsupport.FakeCacheAdapter{}

		uc := part.NewDeleteUseCase(repo, cache)
		err := uc.Execute(context.Background(), "part-1", "company-2")

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindNotFound, appErr.Kind)
		assert.False(t, deleteCalled)
		assert.Empty(t, cache.DelCalls)
	})
}
