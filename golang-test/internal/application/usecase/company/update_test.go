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

func strPtr(v string) *string { return &v }

func TestUpdateUseCase(t *testing.T) {
	t.Run("rejects updating another company's id even with valid data", func(t *testing.T) {
		other := &entity.Company{BaseEntity: entity.BaseEntity{ID: "company-2"}}
		repo := &testsupport.FakeCompanyRepository{
			FindByIDFn: func(_ context.Context, _ string) (*entity.Company, error) { return other, nil },
		}

		uc := company.NewUpdateUseCase(repo)
		_, err := uc.Execute(context.Background(), company.UpdateInput{
			ID: "company-2", CallerCompanyID: "company-1", TradeName: strPtr("New Name"),
		})

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindNotFound, appErr.Kind)
	})

	t.Run("rejects changing contact email to one already used by another company", func(t *testing.T) {
		own := &entity.Company{BaseEntity: entity.BaseEntity{ID: "company-1"}, ContactEmail: "old@acme.test"}
		repo := &testsupport.FakeCompanyRepository{
			FindByIDFn: func(_ context.Context, _ string) (*entity.Company, error) { return own, nil },
			FindByEmailFn: func(_ context.Context, email string) (*entity.Company, error) {
				assert.Equal(t, "taken@other.test", email)
				return &entity.Company{BaseEntity: entity.BaseEntity{ID: "company-2"}}, nil
			},
		}

		uc := company.NewUpdateUseCase(repo)
		_, err := uc.Execute(context.Background(), company.UpdateInput{
			ID: "company-1", CallerCompanyID: "company-1", ContactEmail: strPtr("taken@other.test"),
		})

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindBadRequest, appErr.Kind)
	})

	t.Run("allows keeping the same contact email without a duplicate check", func(t *testing.T) {
		own := &entity.Company{BaseEntity: entity.BaseEntity{ID: "company-1"}, ContactEmail: "same@acme.test"}
		emailCheckCalled := false
		repo := &testsupport.FakeCompanyRepository{
			FindByIDFn: func(_ context.Context, _ string) (*entity.Company, error) { return own, nil },
			FindByEmailFn: func(_ context.Context, _ string) (*entity.Company, error) {
				emailCheckCalled = true
				return nil, nil
			},
			UpdateFn: func(_ context.Context, c *entity.Company) (*entity.Company, error) { return c, nil },
		}

		uc := company.NewUpdateUseCase(repo)
		updated, err := uc.Execute(context.Background(), company.UpdateInput{
			ID: "company-1", CallerCompanyID: "company-1", ContactEmail: strPtr("same@acme.test"),
		})

		require.NoError(t, err)
		assert.False(t, emailCheckCalled)
		assert.Equal(t, "same@acme.test", updated.ContactEmail)
	})
}
