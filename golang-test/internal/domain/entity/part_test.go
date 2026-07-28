package entity_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
)

func makePart(overrides func(*entity.Part)) *entity.Part {
	p := &entity.Part{
		Name:              "Filtro de Oleo X",
		Category:          "engine",
		CurrentStock:      15,
		MinimumStock:      20,
		AverageDailySales: 4,
		LeadTimeDays:      5,
		UnitCost:          18.5,
		CriticalityLevel:  3,
		CompanyID:         "company-1",
	}
	if overrides != nil {
		overrides(p)
	}
	return p
}

func TestExpectedConsumption(t *testing.T) {
	t.Run("multiplies averageDailySales by leadTimeDays", func(t *testing.T) {
		p := makePart(func(p *entity.Part) { p.AverageDailySales = 4; p.LeadTimeDays = 5 })
		assert.Equal(t, 20.0, p.ExpectedConsumption())
	})

	t.Run("is zero when averageDailySales is zero", func(t *testing.T) {
		p := makePart(func(p *entity.Part) { p.AverageDailySales = 0; p.LeadTimeDays = 30 })
		assert.Equal(t, 0.0, p.ExpectedConsumption())
	})
}

func TestProjectedStock(t *testing.T) {
	t.Run("subtracts expected consumption from current stock", func(t *testing.T) {
		p := makePart(func(p *entity.Part) { p.CurrentStock = 15; p.AverageDailySales = 4; p.LeadTimeDays = 5 })
		assert.Equal(t, -5.0, p.ProjectedStock())
	})

	t.Run("can be negative and is not clamped to zero", func(t *testing.T) {
		p := makePart(func(p *entity.Part) { p.CurrentStock = 8; p.AverageDailySales = 3; p.LeadTimeDays = 4 })
		assert.Equal(t, -4.0, p.ProjectedStock())
	})

	t.Run("equals current stock when there is no expected consumption (zero sales)", func(t *testing.T) {
		p := makePart(func(p *entity.Part) { p.CurrentStock = 5; p.AverageDailySales = 0; p.LeadTimeDays = 30 })
		assert.Equal(t, 5.0, p.ProjectedStock())
	})

	t.Run("goes deeply negative with a high lead time", func(t *testing.T) {
		p := makePart(func(p *entity.Part) { p.CurrentStock = 10; p.AverageDailySales = 5; p.LeadTimeDays = 365 })
		assert.Equal(t, 10.0-5*365, p.ProjectedStock())
	})
}

func TestNeedsRestock(t *testing.T) {
	t.Run("is true when projected stock is below minimum stock", func(t *testing.T) {
		p := makePart(func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays = 15, 20, 4, 5
		})
		assert.True(t, p.NeedsRestock())
	})

	t.Run("is false when projected stock is above minimum stock", func(t *testing.T) {
		p := makePart(func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays = 100, 10, 1, 2
		})
		assert.False(t, p.NeedsRestock())
	})

	t.Run("is false when projected stock exactly equals minimum stock (strict less-than)", func(t *testing.T) {
		p := makePart(func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays = 20, 10, 2, 5
		})
		assert.Equal(t, 10.0, p.ProjectedStock())
		assert.False(t, p.NeedsRestock())
	})

	t.Run("is true with zero sales when current stock is already below minimum stock", func(t *testing.T) {
		p := makePart(func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays = 5, 10, 0, 30
		})
		assert.True(t, p.NeedsRestock())
	})
}

func TestUrgencyScore(t *testing.T) {
	t.Run("multiplies the restock gap by criticality level", func(t *testing.T) {
		p := makePart(func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays, p.CriticalityLevel = 15, 20, 4, 5, 3
		})
		// projectedStock = -5, gap = 20 - (-5) = 25, urgencyScore = 25 * 3
		assert.Equal(t, 75.0, p.UrgencyScore())
	})

	t.Run("scales with the minimum criticality level (1)", func(t *testing.T) {
		p := makePart(func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays, p.CriticalityLevel = 8, 10, 3, 4, 1
		})
		assert.Equal(t, 14.0, p.UrgencyScore())
	})

	t.Run("scales with the maximum criticality level (5)", func(t *testing.T) {
		p := makePart(func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays, p.CriticalityLevel = 8, 10, 3, 4, 5
		})
		assert.Equal(t, 70.0, p.UrgencyScore())
	})

	t.Run("is zero when the part does not need restocking", func(t *testing.T) {
		p := makePart(func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays, p.CriticalityLevel = 100, 10, 1, 2, 5
		})
		assert.Equal(t, (10.0-98.0)*5, p.UrgencyScore())
	})

	t.Run("grows very large with a high lead time and high criticality", func(t *testing.T) {
		p := makePart(func(p *entity.Part) {
			p.CurrentStock, p.MinimumStock, p.AverageDailySales, p.LeadTimeDays, p.CriticalityLevel = 10, 10, 5, 365, 5
		})
		expectedGap := 10.0 - (10.0 - 5*365)
		assert.Equal(t, expectedGap*5, p.UrgencyScore())
	})
}
