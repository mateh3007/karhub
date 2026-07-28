package service_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/mateh3007/karhub/golang-test/internal/application/service"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
)

func makePart(name string, overrides func(*entity.Part)) *entity.Part {
	p := &entity.Part{
		Name:              name,
		Category:          "misc",
		CurrentStock:      10,
		MinimumStock:      10,
		AverageDailySales: 2,
		LeadTimeDays:      5,
		UnitCost:          5,
		CriticalityLevel:  2,
		CompanyID:         "company-1",
	}
	if overrides != nil {
		overrides(p)
	}
	return p
}

func names(parts []*entity.Part) []string {
	result := make([]string, len(parts))
	for i, p := range parts {
		result[i] = p.Name
	}
	return result
}

func TestFilterNeedingRestock(t *testing.T) {
	svc := service.NewPartPriorityService()

	t.Run("keeps only parts whose NeedsRestock is true", func(t *testing.T) {
		needsRestock := makePart("Needs Restock", func(p *entity.Part) { p.CurrentStock = 0 })
		doesNotNeed := makePart("Fully Stocked", func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays = 1000, 5, 1, 1
		})

		result := svc.FilterNeedingRestock([]*entity.Part{needsRestock, doesNotNeed})

		assert.Equal(t, []*entity.Part{needsRestock}, result)
	})

	t.Run("returns an empty slice when nothing needs restocking", func(t *testing.T) {
		wellStocked := makePart("Well Stocked", func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays = 1000, 5, 1, 1
		})

		result := svc.FilterNeedingRestock([]*entity.Part{wellStocked})

		assert.Empty(t, result)
	})
}

func TestSortByUrgency(t *testing.T) {
	svc := service.NewPartPriorityService()

	t.Run("orders by urgencyScore descending", func(t *testing.T) {
		low := makePart("Low", func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.CriticalityLevel, p.AverageDailySales, p.LeadTimeDays = 5, 10, 1, 0, 0
		})
		high := makePart("High", func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.CriticalityLevel, p.AverageDailySales, p.LeadTimeDays = -5, 10, 5, 0, 0
		})

		result := svc.SortByUrgency([]*entity.Part{low, high})

		assert.Equal(t, []string{"High", "Low"}, names(result))
	})

	t.Run("breaks urgencyScore ties by higher criticalityLevel first", func(t *testing.T) {
		lessCritical := makePart("Less Critical", func(p *entity.Part) { p.CriticalityLevel = 2 })
		moreCritical := makePart("More Critical", func(p *entity.Part) { p.CriticalityLevel = 4 })

		result := svc.SortByUrgency([]*entity.Part{lessCritical, moreCritical})

		assert.Equal(t, []string{"More Critical", "Less Critical"}, names(result))
	})

	t.Run("breaks a tie in urgencyScore AND criticalityLevel by higher averageDailySales", func(t *testing.T) {
		// Compensate leadTimeDays so expectedConsumption (and thus
		// projectedStock/urgencyScore) stays identical while
		// averageDailySales differs.
		slowerSales := makePart("Slower Sales", func(p *entity.Part) {
			p.AverageDailySales, p.LeadTimeDays, p.CriticalityLevel = 2, 10, 3
		})
		fasterSales := makePart("Faster Sales", func(p *entity.Part) {
			p.AverageDailySales, p.LeadTimeDays, p.CriticalityLevel = 4, 5, 3
		})

		assert.Equal(t, slowerSales.UrgencyScore(), fasterSales.UrgencyScore())

		result := svc.SortByUrgency([]*entity.Part{slowerSales, fasterSales})

		assert.Equal(t, []string{"Faster Sales", "Slower Sales"}, names(result))
	})

	t.Run("breaks a full tie by alphabetical name order", func(t *testing.T) {
		zebra := makePart("Zebra Part", nil)
		alpha := makePart("Alpha Part", nil)

		result := svc.SortByUrgency([]*entity.Part{zebra, alpha})

		assert.Equal(t, []string{"Alpha Part", "Zebra Part"}, names(result))
	})

	t.Run("does not mutate the original slice", func(t *testing.T) {
		parts := []*entity.Part{makePart("Zebra Part", nil), makePart("Alpha Part", nil)}
		original := names(parts)

		svc.SortByUrgency(parts)

		assert.Equal(t, original, names(parts))
	})
}
