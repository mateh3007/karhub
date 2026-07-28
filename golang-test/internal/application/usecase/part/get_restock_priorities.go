package part

import (
	"context"
	"time"

	"github.com/mateh3007/karhub/golang-test/internal/application/service"
	"github.com/mateh3007/karhub/golang-test/internal/domain/cache"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type GetRestockPrioritiesInput struct {
	CompanyID string
	Page      int
	Limit     int
}

// GetRestockPrioritiesUseCase mirrors node-js-test's
// GetRestockPrioritiesUseCase (ADR 0011 + ADR 0012): the full, sorted,
// unpaginated result is what's cached — pagination is applied in memory
// after the cache read, so one cache entry serves every page.
type GetRestockPrioritiesUseCase struct {
	partRepo        repository.PartRepository
	priorityService *service.PartPriorityService
	cache           cache.Adapter
	cacheTTL        time.Duration
}

func NewGetRestockPrioritiesUseCase(
	partRepo repository.PartRepository,
	priorityService *service.PartPriorityService,
	cacheAdapter cache.Adapter,
	cacheTTL time.Duration,
) *GetRestockPrioritiesUseCase {
	return &GetRestockPrioritiesUseCase{
		partRepo:        partRepo,
		priorityService: priorityService,
		cache:           cacheAdapter,
		cacheTTL:        cacheTTL,
	}
}

func (uc *GetRestockPrioritiesUseCase) Execute(ctx context.Context, input GetRestockPrioritiesInput) (pagination.Result[*entity.Part], error) {
	cacheKey := service.CacheKeyFor(input.CompanyID)

	var prioritized []*entity.Part
	found, err := uc.cache.Get(ctx, cacheKey, &prioritized)
	if err != nil {
		return pagination.Result[*entity.Part]{}, err
	}

	if !found {
		prioritized, err = uc.computeAndCache(ctx, input.CompanyID, cacheKey)
		if err != nil {
			return pagination.Result[*entity.Part]{}, err
		}
	}

	return paginate(prioritized, input.Page, input.Limit), nil
}

func (uc *GetRestockPrioritiesUseCase) computeAndCache(ctx context.Context, companyID, cacheKey string) ([]*entity.Part, error) {
	parts, err := uc.partRepo.FindByCompanyID(ctx, companyID)
	if err != nil {
		return nil, err
	}

	needingRestock := uc.priorityService.FilterNeedingRestock(parts)
	prioritized := uc.priorityService.SortByUrgency(needingRestock)

	if err := uc.cache.Set(ctx, cacheKey, prioritized, uc.cacheTTL); err != nil {
		return nil, err
	}

	return prioritized, nil
}

func paginate(parts []*entity.Part, page, limit int) pagination.Result[*entity.Part] {
	total := len(parts)
	start := (page - 1) * limit
	if start > total {
		start = total
	}
	end := start + limit
	if end > total {
		end = total
	}

	data := parts[start:end]
	if data == nil {
		data = []*entity.Part{}
	}

	return pagination.Result[*entity.Part]{
		Data:       data,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: pagination.TotalPages(total, limit),
	}
}
