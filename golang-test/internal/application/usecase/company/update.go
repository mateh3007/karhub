package company

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

// UpdateInput uses pointer fields so "not provided" (nil) and "provided as
// zero value" are distinguishable, matching node-js-test's
// `data.field !== undefined` checks.
type UpdateInput struct {
	ID              string
	CallerCompanyID string
	CorporateName   *string
	TradeName       *string
	ContactEmail    *string
	Phone           *string
}

type UpdateUseCase struct {
	companyRepo repository.CompanyRepository
}

func NewUpdateUseCase(companyRepo repository.CompanyRepository) *UpdateUseCase {
	return &UpdateUseCase{companyRepo: companyRepo}
}

func (uc *UpdateUseCase) Execute(ctx context.Context, input UpdateInput) (*entity.Company, error) {
	company, err := uc.companyRepo.FindByID(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	if company == nil || company.ID != input.CallerCompanyID {
		return nil, apperror.NotFound("Company not found")
	}

	if input.ContactEmail != nil && *input.ContactEmail != company.ContactEmail {
		existing, err := uc.companyRepo.FindByEmail(ctx, *input.ContactEmail)
		if err != nil {
			return nil, err
		}
		if existing != nil {
			return nil, apperror.BadRequest("Company already exists")
		}
		company.ContactEmail = *input.ContactEmail
	}

	if input.CorporateName != nil {
		company.CorporateName = *input.CorporateName
	}
	if input.TradeName != nil {
		company.TradeName = *input.TradeName
	}
	if input.Phone != nil {
		company.Phone = *input.Phone
	}

	return uc.companyRepo.Update(ctx, company)
}
