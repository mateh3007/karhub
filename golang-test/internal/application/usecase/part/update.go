package part

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
	"github.com/mateh3007/karhub/golang-test/internal/application/service"
	"github.com/mateh3007/karhub/golang-test/internal/domain/cache"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

// UpdateInput uses pointer fields throughout so an explicitly-provided zero
// (currentStock: 0, averageDailySales: 0, ...) is applied rather than
// silently skipped — the same distinction node-js-test's
// `data.field !== undefined` checks make.
type UpdateInput struct {
	ID                string
	CompanyID         string
	Name              *string
	Category          *string
	CurrentStock      *int
	MinimumStock      *int
	AverageDailySales *float64
	LeadTimeDays      *int
	UnitCost          *float64
	CriticalityLevel  *int
}

type UpdateUseCase struct {
	partRepo repository.PartRepository
	cache    cache.Adapter
}

func NewUpdateUseCase(partRepo repository.PartRepository, cacheAdapter cache.Adapter) *UpdateUseCase {
	return &UpdateUseCase{partRepo: partRepo, cache: cacheAdapter}
}

func (uc *UpdateUseCase) Execute(ctx context.Context, input UpdateInput) (*entity.Part, error) {
	part, err := uc.partRepo.FindByIDAndCompanyID(ctx, input.ID, input.CompanyID)
	if err != nil {
		return nil, err
	}
	if part == nil {
		return nil, apperror.NotFound("Part not found")
	}

	if input.Name != nil {
		part.Name = *input.Name
	}
	if input.Category != nil {
		part.Category = *input.Category
	}
	if input.CurrentStock != nil {
		part.CurrentStock = *input.CurrentStock
	}
	if input.MinimumStock != nil {
		part.MinimumStock = *input.MinimumStock
	}
	if input.AverageDailySales != nil {
		part.AverageDailySales = *input.AverageDailySales
	}
	if input.LeadTimeDays != nil {
		part.LeadTimeDays = *input.LeadTimeDays
	}
	if input.UnitCost != nil {
		part.UnitCost = *input.UnitCost
	}
	if input.CriticalityLevel != nil {
		part.CriticalityLevel = *input.CriticalityLevel
	}

	updated, err := uc.partRepo.Update(ctx, part)
	if err != nil {
		return nil, err
	}

	if err := uc.cache.Del(ctx, service.CacheKeyFor(input.CompanyID)); err != nil {
		return nil, err
	}

	return updated, nil
}
