package part

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/application/service"
	"github.com/mateh3007/karhub/golang-test/internal/domain/cache"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type DeleteUseCase struct {
	partRepo repository.PartRepository
	cache    cache.Adapter
}

func NewDeleteUseCase(partRepo repository.PartRepository, cacheAdapter cache.Adapter) *DeleteUseCase {
	return &DeleteUseCase{partRepo: partRepo, cache: cacheAdapter}
}

func (uc *DeleteUseCase) Execute(ctx context.Context, id, companyID string) error {
	part, err := uc.partRepo.FindByIDAndCompanyID(ctx, id, companyID)
	if err != nil {
		return err
	}
	if part == nil {
		return apperror.NotFound("Part not found")
	}

	if err := uc.partRepo.Delete(ctx, id); err != nil {
		return err
	}

	return uc.cache.Del(ctx, service.CacheKeyFor(companyID))
}
