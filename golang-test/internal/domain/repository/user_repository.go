package repository

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
)

type UserRepository interface {
	Create(ctx context.Context, user *entity.User) (*entity.User, error)
	FindByID(ctx context.Context, id string) (*entity.User, error)
	Update(ctx context.Context, user *entity.User) (*entity.User, error)
	Delete(ctx context.Context, id string) error
	FindByEmail(ctx context.Context, email string) (*entity.User, error)

	// FindPageByCompanyID and FindByIDAndCompanyID are the tenant-scoped
	// lookups every user-facing route actually uses (see ADR 0005 in
	// node-js-test) — companyId always comes from the JWT, never a param.
	FindPageByCompanyID(ctx context.Context, companyID string, params pagination.Params) (pagination.Result[*entity.User], error)
	FindByIDAndCompanyID(ctx context.Context, id, companyID string) (*entity.User, error)
}
