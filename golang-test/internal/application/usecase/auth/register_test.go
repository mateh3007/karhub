package auth_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/auth"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/testsupport"
)

func TestRegisterUseCase(t *testing.T) {
	newInput := func() auth.RegisterInput {
		return auth.RegisterInput{
			CorporateName: "Acme Corp",
			TradeName:     "Acme",
			CNPJ:          "12345678000199",
			Phone:         "+55 11 90000-0000",
			ContactEmail:  "contact@acme.test",
			AdminName:     "Admin",
			AdminPassword: "s3cret-password",
		}
	}

	noDuplicatesRepos := func() (*testsupport.FakeCompanyRepository, *testsupport.FakeUserRepository) {
		companyRepo := &testsupport.FakeCompanyRepository{
			FindByCNPJFn:  func(_ context.Context, _ string) (*entity.Company, error) { return nil, nil },
			FindByEmailFn: func(_ context.Context, _ string) (*entity.Company, error) { return nil, nil },
			CreateFn: func(_ context.Context, c *entity.Company) (*entity.Company, error) {
				return c, nil
			},
		}
		userRepo := &testsupport.FakeUserRepository{
			FindByEmailFn: func(_ context.Context, _ string) (*entity.User, error) { return nil, nil },
			CreateFn: func(_ context.Context, u *entity.User) (*entity.User, error) {
				return u, nil
			},
		}
		return companyRepo, userRepo
	}

	t.Run("creates the company and an admin user with a bcrypt-hashed password", func(t *testing.T) {
		companyRepo, userRepo := noDuplicatesRepos()

		uc := auth.NewRegisterUseCase(companyRepo, userRepo)
		out, err := uc.Execute(context.Background(), newInput())

		require.NoError(t, err)
		assert.Equal(t, "12345678000199", out.Company.CNPJ)
		assert.Equal(t, entity.RoleAdmin, out.User.Role)
		assert.Equal(t, out.Company.ID, out.User.CompanyID)
		assert.NotEqual(t, "s3cret-password", out.User.Password)
		assert.NoError(t, bcrypt.CompareHashAndPassword([]byte(out.User.Password), []byte("s3cret-password")))
	})

	t.Run("rejects a duplicate CNPJ before touching the user repository", func(t *testing.T) {
		companyRepo, userRepo := noDuplicatesRepos()
		companyRepo.FindByCNPJFn = func(_ context.Context, _ string) (*entity.Company, error) {
			return &entity.Company{BaseEntity: entity.BaseEntity{ID: "existing"}}, nil
		}
		userRepo.FindByEmailFn = func(_ context.Context, _ string) (*entity.User, error) {
			t.Fatal("should not check user email when company CNPJ already exists")
			return nil, nil
		}

		uc := auth.NewRegisterUseCase(companyRepo, userRepo)
		out, err := uc.Execute(context.Background(), newInput())

		assert.Nil(t, out)
		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindBadRequest, appErr.Kind)
		assert.Equal(t, "Company already exists", appErr.Message)
	})

	t.Run("rejects a duplicate contact email even when the CNPJ is free", func(t *testing.T) {
		companyRepo, userRepo := noDuplicatesRepos()
		companyRepo.FindByEmailFn = func(_ context.Context, _ string) (*entity.Company, error) {
			return &entity.Company{BaseEntity: entity.BaseEntity{ID: "existing"}}, nil
		}

		uc := auth.NewRegisterUseCase(companyRepo, userRepo)
		_, err := uc.Execute(context.Background(), newInput())

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, "Company already exists", appErr.Message)
	})

	t.Run("rejects when a user already exists with the contact email, even if no company does", func(t *testing.T) {
		companyRepo, userRepo := noDuplicatesRepos()
		userRepo.FindByEmailFn = func(_ context.Context, _ string) (*entity.User, error) {
			return &entity.User{BaseEntity: entity.BaseEntity{ID: "existing"}}, nil
		}

		uc := auth.NewRegisterUseCase(companyRepo, userRepo)
		_, err := uc.Execute(context.Background(), newInput())

		var appErr *apperror.Error
		require.ErrorAs(t, err, &appErr)
		assert.Equal(t, apperror.KindBadRequest, appErr.Kind)
		assert.Equal(t, "User already exists", appErr.Message)
	})
}
