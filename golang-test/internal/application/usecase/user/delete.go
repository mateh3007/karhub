package user

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type DeleteUseCase struct {
	userRepo repository.UserRepository
}

func NewDeleteUseCase(userRepo repository.UserRepository) *DeleteUseCase {
	return &DeleteUseCase{userRepo: userRepo}
}

func (uc *DeleteUseCase) Execute(ctx context.Context, id, companyID string) error {
	user, err := uc.userRepo.FindByIDAndCompanyID(ctx, id, companyID)
	if err != nil {
		return err
	}
	if user == nil {
		return apperror.NotFound("User not found")
	}
	return uc.userRepo.Delete(ctx, id)
}
