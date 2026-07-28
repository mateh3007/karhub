package company_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/company"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/testsupport"
)

func TestGetByIDUseCase(t *testing.T) {
	own := &entity.Company{BaseEntity: entity.BaseEntity{ID: "company-1"}, CorporateName: "Acme"}

	t.Run("returns the caller's own company", func(t *testing.T) {
		repo := &testsupport.FakeCompanyRepository{
			FindByIDFn: func(_ context.Context, id string) (*entity.Company, error) {
				assert.Equal(t, "company-1", id)
				return own, nil
			},
		}

		uc := company.NewGetByIDUseCase(repo)
		got, err := uc.Execute(context.Background(), "company-1", "company-1")

		require.NoError(t, err)
		assert.Same(t, own, got)
	})

	t.Run("returns NotFound (not Forbidden) for another company's id — a cross-tenant caller can't confirm it exists", func(t *testing.T) {
		other := &entity.Company{BaseEntity: entity.BaseEntity{ID: "company-2"}}
		repo := &testsupport.FakeCompanyRepository{
			FindByIDFn: func(_ context.Context, _ string) (*entity.Company, error) {
				return other, nil
			},
		}

		uc := company.NewGetByIDUseCase(repo)
		got, err := uc.Execute(context.Background(), "company-2", "company-1")

		assert.Nil(t, got)
		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindNotFound, appErr.Kind)
	})

	t.Run("returns NotFound when the company doesn't exist at all", func(t *testing.T) {
		repo := &testsupport.FakeCompanyRepository{
			FindByIDFn: func(_ context.Context, _ string) (*entity.Company, error) { return nil, nil },
		}

		uc := company.NewGetByIDUseCase(repo)
		_, err := uc.Execute(context.Background(), "unknown", "company-1")

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindNotFound, appErr.Kind)
	})
}
