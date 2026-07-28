package part

import (
	"context"

	"github.com/mateh3007/karhub/golang-test/internal/application/service"
	"github.com/mateh3007/karhub/golang-test/internal/domain/cache"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/repository"
)

type CreateInput struct {
	Name              string
	Category          string
	CurrentStock      int
	MinimumStock      int
	AverageDailySales float64
	LeadTimeDays      int
	UnitCost          float64
	CriticalityLevel  int
	CompanyID         string
}

type CreateUseCase struct {
	partRepo repository.PartRepository
	cache    cache.Adapter
}

func NewCreateUseCase(partRepo repository.PartRepository, cacheAdapter cache.Adapter) *CreateUseCase {
	return &CreateUseCase{partRepo: partRepo, cache: cacheAdapter}
}

func (uc *CreateUseCase) Execute(ctx context.Context, input CreateInput) (*entity.Part, error) {
	created, err := uc.partRepo.Create(ctx, &entity.Part{
		BaseEntity:        entity.NewBaseEntity(),
		Name:              input.Name,
		Category:          input.Category,
		CurrentStock:      input.CurrentStock,
		MinimumStock:      input.MinimumStock,
		AverageDailySales: input.AverageDailySales,
		LeadTimeDays:      input.LeadTimeDays,
		UnitCost:          input.UnitCost,
		CriticalityLevel:  input.CriticalityLevel,
		CompanyID:         input.CompanyID,
	})
	if err != nil {
		return nil, err
	}

	if err := uc.cache.Del(ctx, service.CacheKeyFor(input.CompanyID)); err != nil {
		return nil, err
	}

	return created, nil
}
