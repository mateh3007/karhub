package user

import (
	"context"

	"golang.org/x/crypto/bcrypt"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type CreateInput struct {
	Name      string
	Email     string
	Password  string
	Role      entity.Role
	CompanyID string
}

type CreateUseCase struct {
	userRepo    repository.UserRepository
	companyRepo repository.CompanyRepository
}

func NewCreateUseCase(userRepo repository.UserRepository, companyRepo repository.CompanyRepository) *CreateUseCase {
	return &CreateUseCase{userRepo: userRepo, companyRepo: companyRepo}
}

func (uc *CreateUseCase) Execute(ctx context.Context, input CreateInput) (*entity.User, error) {
	company, err := uc.companyRepo.FindByID(ctx, input.CompanyID)
	if err != nil {
		return nil, err
	}
	if company == nil {
		return nil, apperror.NotFound("Company not found")
	}

	existing, err := uc.userRepo.FindByEmail(ctx, input.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, apperror.BadRequest("User already exists")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	return uc.userRepo.Create(ctx, &entity.User{
		BaseEntity: entity.NewBaseEntity(),
		Name:       input.Name,
		Email:      input.Email,
		Password:   string(hashed),
		Role:       input.Role,
		CompanyID:  input.CompanyID,
	})
}
