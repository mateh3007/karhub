package user

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type GetByIDUseCase struct {
	userRepo repository.UserRepository
}

func NewGetByIDUseCase(userRepo repository.UserRepository) *GetByIDUseCase {
	return &GetByIDUseCase{userRepo: userRepo}
}

func (uc *GetByIDUseCase) Execute(ctx context.Context, id, companyID string) (*entity.User, error) {
	user, err := uc.userRepo.FindByIDAndCompanyID(ctx, id, companyID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, apperror.NotFound("User not found")
	}
	return user, nil
}
