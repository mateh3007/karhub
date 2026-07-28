package entity

type Part struct {
	BaseEntity
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

// ExpectedConsumption, ProjectedStock, NeedsRestock and UrgencyScore mirror
// node-js-test's PartEntity methods (src/domain/entities/part.entity.ts)
// verbatim — this is the challenge's core formula, and it must produce
// identical numbers in both backends for the same input.

func (p *Part) ExpectedConsumption() float64 {
	return p.AverageDailySales * float64(p.LeadTimeDays)
}

func (p *Part) ProjectedStock() float64 {
	return float64(p.CurrentStock) - p.ExpectedConsumption()
}

// NeedsRestock uses a strict less-than: a part whose projected stock lands
// exactly on the minimum does not need restocking.
func (p *Part) NeedsRestock() bool {
	return p.ProjectedStock() < float64(p.MinimumStock)
}

func (p *Part) UrgencyScore() float64 {
	return (float64(p.MinimumStock) - p.ProjectedStock()) * float64(p.CriticalityLevel)
}
