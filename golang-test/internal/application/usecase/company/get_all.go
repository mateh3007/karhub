package company

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

// GetAllUseCase backs GET /companies. Company is the tenant root, so there's
// nothing to list beyond the caller's own company — it always returns a
// zero-or-one-element slice, never every company in the system (see ADR 0005).
type GetAllUseCase struct {
	companyRepo repository.CompanyRepository
}

func NewGetAllUseCase(companyRepo repository.CompanyRepository) *GetAllUseCase {
	return &GetAllUseCase{companyRepo: companyRepo}
}

func (uc *GetAllUseCase) Execute(ctx context.Context, callerCompanyID string) ([]*entity.Company, error) {
	company, err := uc.companyRepo.FindByID(ctx, callerCompanyID)
	if err != nil {
		return nil, err
	}
	if company == nil {
		return []*entity.Company{}, nil
	}
	return []*entity.Company{company}, nil
}
