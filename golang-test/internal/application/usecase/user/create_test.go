package user_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/user"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/testsupport"
)

func TestCreateUseCase(t *testing.T) {
	existingCompany := &entity.Company{BaseEntity: entity.BaseEntity{ID: "company-1"}}

	t.Run("creates the user with a bcrypt-hashed password when the company exists and the email is free", func(t *testing.T) {
		userRepo := &testsupport.FakeUserRepository{
			FindByEmailFn: func(_ context.Context, _ string) (*entity.User, error) { return nil, nil },
			CreateFn:      func(_ context.Context, u *entity.User) (*entity.User, error) { return u, nil },
		}
		companyRepo := &testsupport.FakeCompanyRepository{
			FindByIDFn: func(_ context.Context, id string) (*entity.Company, error) {
				assert.Equal(t, "company-1", id)
				return existingCompany, nil
			},
		}

		uc := user.NewCreateUseCase(userRepo, companyRepo)
		created, err := uc.Execute(context.Background(), user.CreateInput{
			Name: "New User", Email: "new@acme.test", Password: "s3cret-password", Role: entity.RoleUser, CompanyID: "company-1",
		})

		require.NoError(t, err)
		assert.Equal(t, "company-1", created.CompanyID)
		assert.NoError(t, bcrypt.CompareHashAndPassword([]byte(created.Password), []byte("s3cret-password")))
	})

	t.Run("rejects when the company doesn't exist", func(t *testing.T) {
		companyRepo := &testsupport.FakeCompanyRepository{
			FindByIDFn: func(_ context.Context, _ string) (*entity.Company, error) { return nil, nil },
		}
		userRepo := &testsupport.FakeUserRepository{
			FindByEmailFn: func(_ context.Context, _ string) (*entity.User, error) {
				t.Fatal("should not check email when company doesn't exist")
				return nil, nil
			},
		}

		uc := user.NewCreateUseCase(userRepo, companyRepo)
		_, err := uc.Execute(context.Background(), user.CreateInput{CompanyID: "missing"})

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindNotFound, appErr.Kind)
	})

	t.Run("rejects a duplicate email", func(t *testing.T) {
		companyRepo := &testsupport.FakeCompanyRepository{
			FindByIDFn: func(_ context.Context, _ string) (*entity.Company, error) { return existingCompany, nil },
		}
		userRepo := &testsupport.FakeUserRepository{
			FindByEmailFn: func(_ context.Context, _ string) (*entity.User, error) {
				return &entity.User{BaseEntity: entity.BaseEntity{ID: "existing"}}, nil
			},
		}

		uc := user.NewCreateUseCase(userRepo, companyRepo)
		_, err := uc.Execute(context.Background(), user.CreateInput{CompanyID: "company-1", Email: "taken@acme.test"})

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindBadRequest, appErr.Kind)
		assert.Equal(t, "User already exists", appErr.Message)
	})
}
