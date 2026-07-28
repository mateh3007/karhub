package user

import (
	"context"

	"golang.org/x/crypto/bcrypt"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type UpdateInput struct {
	ID        string
	CompanyID string
	Name      *string
	Email     *string
	Password  *string
	Role      *entity.Role
}

type UpdateUseCase struct {
	userRepo repository.UserRepository
}

func NewUpdateUseCase(userRepo repository.UserRepository) *UpdateUseCase {
	return &UpdateUseCase{userRepo: userRepo}
}

func (uc *UpdateUseCase) Execute(ctx context.Context, input UpdateInput) (*entity.User, error) {
	user, err := uc.userRepo.FindByIDAndCompanyID(ctx, input.ID, input.CompanyID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, apperror.NotFound("User not found")
	}

	if input.Email != nil && *input.Email != user.Email {
		existing, err := uc.userRepo.FindByEmail(ctx, *input.Email)
		if err != nil {
			return nil, err
		}
		if existing != nil {
			return nil, apperror.BadRequest("User already exists")
		}
		user.Email = *input.Email
	}

	if input.Name != nil {
		user.Name = *input.Name
	}
	if input.Role != nil {
		user.Role = *input.Role
	}
	if input.Password != nil {
		hashed, err := bcrypt.GenerateFromPassword([]byte(*input.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hashed)
	}

	return uc.userRepo.Update(ctx, user)
}
