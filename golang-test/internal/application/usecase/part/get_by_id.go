package part

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type GetByIDUseCase struct {
	partRepo repository.PartRepository
}

func NewGetByIDUseCase(partRepo repository.PartRepository) *GetByIDUseCase {
	return &GetByIDUseCase{partRepo: partRepo}
}

func (uc *GetByIDUseCase) Execute(ctx context.Context, id, companyID string) (*entity.Part, error) {
	part, err := uc.partRepo.FindByIDAndCompanyID(ctx, id, companyID)
	if err != nil {
		return nil, err
	}
	if part == nil {
		return nil, apperror.NotFound("Part not found")
	}
	return part, nil
}
