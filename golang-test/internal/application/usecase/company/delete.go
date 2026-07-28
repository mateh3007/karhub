package company

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type DeleteUseCase struct {
	companyRepo repository.CompanyRepository
}

func NewDeleteUseCase(companyRepo repository.CompanyRepository) *DeleteUseCase {
	return &DeleteUseCase{companyRepo: companyRepo}
}

func (uc *DeleteUseCase) Execute(ctx context.Context, id, callerCompanyID string) error {
	company, err := uc.companyRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if company == nil || company.ID != callerCompanyID {
		return apperror.NotFound("Company not found")
	}
	return uc.companyRepo.Delete(ctx, id)
}
