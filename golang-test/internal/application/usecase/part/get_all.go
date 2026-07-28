package part

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type GetAllInput struct {
	CompanyID string
	Category  *string
	Page      int
	Limit     int
}

type GetAllUseCase struct {
	partRepo repository.PartRepository
}

func NewGetAllUseCase(partRepo repository.PartRepository) *GetAllUseCase {
	return &GetAllUseCase{partRepo: partRepo}
}

func (uc *GetAllUseCase) Execute(ctx context.Context, input GetAllInput) (pagination.Result[*entity.Part], error) {
	return uc.partRepo.FindPageByCompanyID(ctx, input.CompanyID, pagination.Params{Page: input.Page, Limit: input.Limit}, input.Category)
}
