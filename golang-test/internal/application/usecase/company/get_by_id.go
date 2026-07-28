package company

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type GetByIDUseCase struct {
	companyRepo repository.CompanyRepository
}

func NewGetByIDUseCase(companyRepo repository.CompanyRepository) *GetByIDUseCase {
	return &GetByIDUseCase{companyRepo: companyRepo}
}

// Execute treats "exists but isn't the caller's own company" the same as
// "doesn't exist" — 404, not 403, so a cross-tenant caller can't even
// confirm a given id exists (see ADR 0005).
func (uc *GetByIDUseCase) Execute(ctx context.Context, id, callerCompanyID string) (*entity.Company, error) {
	company, err := uc.companyRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if company == nil || company.ID != callerCompanyID {
		return nil, apperror.NotFound("Company not found")
	}
	return company, nil
}
