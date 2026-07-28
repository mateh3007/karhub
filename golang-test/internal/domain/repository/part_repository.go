package repository

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
)

type PartRepository interface {
	Create(ctx context.Context, part *entity.Part) (*entity.Part, error)
	FindByID(ctx context.Context, id string) (*entity.Part, error)
	Update(ctx context.Context, part *entity.Part) (*entity.Part, error)
	Delete(ctx context.Context, id string) error

	// FindByCompanyID returns every part needing evaluation for restock
	// priorities, unpaginated — urgencyScore isn't a DB column, so the
	// full company-scoped set has to come back and get sorted in memory
	// (see ADR 0012 in node-js-test). FindPageByCompanyID is the one used
	// by the plain, paginated GET /parts listing.
	FindByCompanyID(ctx context.Context, companyID string) ([]*entity.Part, error)
	FindPageByCompanyID(ctx context.Context, companyID string, params pagination.Params, category *string) (pagination.Result[*entity.Part], error)
	FindByIDAndCompanyID(ctx context.Context, id, companyID string) (*entity.Part, error)
}
