package company

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type CreateInput struct {
	CorporateName string
	TradeName     string
	CNPJ          string
	ContactEmail  string
	Phone         string
}

type CreateUseCase struct {
	companyRepo repository.CompanyRepository
}

func NewCreateUseCase(companyRepo repository.CompanyRepository) *CreateUseCase {
	return &CreateUseCase{companyRepo: companyRepo}
}

func (uc *CreateUseCase) Execute(ctx context.Context, input CreateInput) (*entity.Company, error) {
	existingByCNPJ, err := uc.companyRepo.FindByCNPJ(ctx, input.CNPJ)
	if err != nil {
		return nil, err
	}
	if existingByCNPJ != nil {
		return nil, apperror.BadRequest("Company already exists")
	}

	existingByEmail, err := uc.companyRepo.FindByEmail(ctx, input.ContactEmail)
	if err != nil {
		return nil, err
	}
	if existingByEmail != nil {
		return nil, apperror.BadRequest("Company already exists")
	}

	return uc.companyRepo.Create(ctx, &entity.Company{
		BaseEntity:    entity.NewBaseEntity(),
		CNPJ:          input.CNPJ,
		CorporateName: input.CorporateName,
		TradeName:     input.TradeName,
		ContactEmail:  input.ContactEmail,
		Phone:         input.Phone,
	})
}
