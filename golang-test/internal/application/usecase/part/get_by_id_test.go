package part_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/part"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/testsupport"
)

func TestGetByIDUseCase(t *testing.T) {
	t.Run("returns the part when it belongs to the caller's company", func(t *testing.T) {
		want := &entity.Part{BaseEntity: entity.BaseEntity{ID: "part-1"}, CompanyID: "company-1"}
		repo := &testsupport.FakePartRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, id, companyID string) (*entity.Part, error) {
				assert.Equal(t, "part-1", id)
				assert.Equal(t, "company-1", companyID)
				return want, nil
			},
		}

		uc := part.NewGetByIDUseCase(repo)
		got, err := uc.Execute(context.Background(), "part-1", "company-1")

		require.NoError(t, err)
		assert.Same(t, want, got)
	})

	t.Run("returns NotFound (never leaks whether the part exists in another company) when the repository finds nothing", func(t *testing.T) {
		repo := &testsupport.FakePartRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, _, _ string) (*entity.Part, error) {
				return nil, nil
			},
		}

		uc := part.NewGetByIDUseCase(repo)
		got, err := uc.Execute(context.Background(), "part-1", "company-1")

		assert.Nil(t, got)
		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindNotFound, appErr.Kind)
	})
}
