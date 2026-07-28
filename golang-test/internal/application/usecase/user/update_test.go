package user_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/user"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/testsupport"
)

func strPtr(v string) *string { return &v }

func TestUpdateUseCase(t *testing.T) {
	t.Run("returns NotFound for a user belonging to a different company (cross-tenant isolation)", func(t *testing.T) {
		repo := &testsupport.FakeUserRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, _, _ string) (*entity.User, error) { return nil, nil },
		}

		uc := user.NewUpdateUseCase(repo)
		_, err := uc.Execute(context.Background(), user.UpdateInput{ID: "user-1", CompanyID: "company-2"})

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindNotFound, appErr.Kind)
	})

	t.Run("rejects changing email to one already taken by another user", func(t *testing.T) {
		existing := &entity.User{BaseEntity: entity.BaseEntity{ID: "user-1"}, Email: "old@acme.test", CompanyID: "company-1"}
		repo := &testsupport.FakeUserRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, _, _ string) (*entity.User, error) { return existing, nil },
			FindByEmailFn: func(_ context.Context, _ string) (*entity.User, error) {
				return &entity.User{BaseEntity: entity.BaseEntity{ID: "user-2"}}, nil
			},
		}

		uc := user.NewUpdateUseCase(repo)
		_, err := uc.Execute(context.Background(), user.UpdateInput{ID: "user-1", CompanyID: "company-1", Email: strPtr("taken@acme.test")})

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindBadRequest, appErr.Kind)
	})

	t.Run("re-hashes the password when one is provided", func(t *testing.T) {
		existing := &entity.User{BaseEntity: entity.BaseEntity{ID: "user-1"}, Password: "old-hash", CompanyID: "company-1"}
		repo := &testsupport.FakeUserRepository{
			FindByIDAndCompanyIDFn: func(_ context.Context, _, _ string) (*entity.User, error) { return existing, nil },
			UpdateFn:               func(_ context.Context, u *entity.User) (*entity.User, error) { return u, nil },
		}

		uc := user.NewUpdateUseCase(repo)
		updated, err := uc.Execute(context.Background(), user.UpdateInput{ID: "user-1", CompanyID: "company-1", Password: strPtr("new-password")})

		require.NoError(t, err)
		assert.NotEqual(t, "old-hash", updated.Password)
		assert.NotEqual(t, "new-password", updated.Password)
	})
}
