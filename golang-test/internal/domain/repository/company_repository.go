package repository

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
)

type CompanyRepository interface {
	Create(ctx context.Context, company *entity.Company) (*entity.Company, error)
	FindByID(ctx context.Context, id string) (*entity.Company, error)
	Update(ctx context.Context, company *entity.Company) (*entity.Company, error)
	Delete(ctx context.Context, id string) error
	FindByCNPJ(ctx context.Context, cnpj string) (*entity.Company, error)
	FindByEmail(ctx context.Context, email string) (*entity.Company, error)
}
