package auth_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/auth"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/infra/jwtauth"
	"github.com/mateh3007/karhub/golang-test/internal/testsupport"
)

func TestLoginUseCase(t *testing.T) {
	hashed, err := bcrypt.GenerateFromPassword([]byte("correct-password"), bcrypt.DefaultCost)
	require.NoError(t, err)

	existingUser := &entity.User{
		BaseEntity: entity.BaseEntity{ID: "user-1"},
		Email:      "admin@acme.test",
		Password:   string(hashed),
		Role:       entity.RoleAdmin,
		CompanyID:  "company-1",
	}

	jwtService := jwtauth.NewService("test-secret", 24*time.Hour)

	t.Run("returns a signed token for correct credentials", func(t *testing.T) {
		repo := &testsupport.FakeUserRepository{
			FindByEmailFn: func(_ context.Context, email string) (*entity.User, error) {
				assert.Equal(t, "admin@acme.test", email)
				return existingUser, nil
			},
		}

		uc := auth.NewLoginUseCase(repo, jwtService)
		out, err := uc.Execute(context.Background(), auth.LoginInput{Email: "admin@acme.test", Password: "correct-password"})

		require.NoError(t, err)
		require.NotEmpty(t, out.AccessToken)

		claims, err := jwtService.Verify(out.AccessToken)
		require.NoError(t, err)
		assert.Equal(t, "user-1", claims.Sub)
		assert.Equal(t, "company-1", claims.CompanyID)
		assert.Equal(t, entity.RoleAdmin, claims.Role)
	})

	t.Run("returns the same Unauthorized error for an unknown email as for a wrong password (no user enumeration)", func(t *testing.T) {
		unknownRepo := &testsupport.FakeUserRepository{
			FindByEmailFn: func(_ context.Context, _ string) (*entity.User, error) { return nil, nil },
		}
		wrongPasswordRepo := &testsupport.FakeUserRepository{
			FindByEmailFn: func(_ context.Context, _ string) (*entity.User, error) { return existingUser, nil },
		}

		_, errUnknown := auth.NewLoginUseCase(unknownRepo, jwtService).Execute(context.Background(), auth.LoginInput{Email: "nobody@acme.test", Password: "whatever"})
		_, errWrongPassword := auth.NewLoginUseCase(wrongPasswordRepo, jwtService).Execute(context.Background(), auth.LoginInput{Email: "admin@acme.test", Password: "wrong"})

		var appErrUnknown, appErrWrongPassword *apperror.Error
		require.ErrorAs(t, errUnknown, &appErrUnknown)
		require.ErrorAs(t, errWrongPassword, &appErrWrongPassword)
		assert.Equal(t, apperror.KindUnauthorized, appErrUnknown.Kind)
		assert.Equal(t, appErrUnknown.Message, appErrWrongPassword.Message)
		assert.Equal(t, "Invalid credentials", appErrUnknown.Message)
	})
}
