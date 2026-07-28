package auth

import (
	"context"

	"golang.org/x/crypto/bcrypt"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type RegisterInput struct {
	CorporateName string
	TradeName     string
	CNPJ          string
	Phone         string
	ContactEmail  string
	AdminName     string
	AdminPassword string
}

type RegisterOutput struct {
	Company *entity.Company
	User    *entity.User
}

type RegisterUseCase struct {
	companyRepo repository.CompanyRepository
	userRepo    repository.UserRepository
}

func NewRegisterUseCase(companyRepo repository.CompanyRepository, userRepo repository.UserRepository) *RegisterUseCase {
	return &RegisterUseCase{companyRepo: companyRepo, userRepo: userRepo}
}

func (uc *RegisterUseCase) Execute(ctx context.Context, input RegisterInput) (*RegisterOutput, error) {
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

	existingUser, err := uc.userRepo.FindByEmail(ctx, input.ContactEmail)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, apperror.BadRequest("User already exists")
	}

	company, err := uc.companyRepo.Create(ctx, &entity.Company{
		BaseEntity:    entity.NewBaseEntity(),
		CNPJ:          input.CNPJ,
		CorporateName: input.CorporateName,
		TradeName:     input.TradeName,
		ContactEmail:  input.ContactEmail,
		Phone:         input.Phone,
	})
	if err != nil {
		return nil, err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	admin, err := uc.userRepo.Create(ctx, &entity.User{
		BaseEntity: entity.NewBaseEntity(),
		Name:       input.AdminName,
		Email:      company.ContactEmail,
		Password:   string(hashed),
		Role:       entity.RoleAdmin,
		CompanyID:  company.ID,
	})
	if err != nil {
		return nil, err
	}

	return &RegisterOutput{Company: company, User: admin}, nil
}
