package auth

import (
	"context"

	"golang.org/x/crypto/bcrypt"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
	"github.com/mateh3007/karhub/golang-test/internal/infra/jwtauth"
)

type LoginInput struct {
	Email    string
	Password string
}

type LoginOutput struct {
	AccessToken string
}

type LoginUseCase struct {
	userRepo repository.UserRepository
	jwt      *jwtauth.Service
}

func NewLoginUseCase(userRepo repository.UserRepository, jwt *jwtauth.Service) *LoginUseCase {
	return &LoginUseCase{userRepo: userRepo, jwt: jwt}
}

// Execute returns the same "Invalid credentials" error whether the email
// doesn't exist or the password is wrong — no user enumeration, matching
// node-js-test's LoginUseCase.
func (uc *LoginUseCase) Execute(ctx context.Context, input LoginInput) (*LoginOutput, error) {
	user, err := uc.userRepo.FindByEmail(ctx, input.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, apperror.Unauthorized("Invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return nil, apperror.Unauthorized("Invalid credentials")
	}

	token, err := uc.jwt.Sign(user.ID, user.Email, user.Role, user.CompanyID)
	if err != nil {
		return nil, err
	}

	return &LoginOutput{AccessToken: token}, nil
}
