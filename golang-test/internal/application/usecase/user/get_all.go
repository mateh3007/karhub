package user

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type GetAllInput struct {
	CompanyID string
	Page      int
	Limit     int
}

type GetAllUseCase struct {
	userRepo repository.UserRepository
}

func NewGetAllUseCase(userRepo repository.UserRepository) *GetAllUseCase {
	return &GetAllUseCase{userRepo: userRepo}
}

func (uc *GetAllUseCase) Execute(ctx context.Context, input GetAllInput) (pagination.Result[*entity.User], error) {
	return uc.userRepo.FindPageByCompanyID(ctx, input.CompanyID, pagination.Params{Page: input.Page, Limit: input.Limit})
}
