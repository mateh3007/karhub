// Package service holds cross-cutting pure business logic that doesn't
// belong to a single entity — mirrors node-js-test's
// application/services/part-priority.service.ts (ADR 0007).
package service

import (
	"sort"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
)

func CacheKeyFor(companyID string) string {
	return "restock-priorities:" + companyID
}

type PartPriorityService struct{}

func NewPartPriorityService() *PartPriorityService {
	return &PartPriorityService{}
}

func (s *PartPriorityService) FilterNeedingRestock(parts []*entity.Part) []*entity.Part {
	result := make([]*entity.Part, 0, len(parts))
	for _, p := range parts {
		if p.NeedsRestock() {
			result = append(result, p)
		}
	}
	return result
}

// SortByUrgency ranks parts by urgencyScore desc, tie-broken by
// criticalityLevel desc, then averageDailySales desc, then name asc —
// verbatim from PartPriorityService.compare in node-js-test. Does not
// mutate the input slice.
func (s *PartPriorityService) SortByUrgency(parts []*entity.Part) []*entity.Part {
	sorted := make([]*entity.Part, len(parts))
	copy(sorted, parts)

	sort.SliceStable(sorted, func(i, j int) bool {
		return less(sorted[i], sorted[j])
	})
	return sorted
}

func less(a, b *entity.Part) bool {
	if a.UrgencyScore() != b.UrgencyScore() {
		return a.UrgencyScore() > b.UrgencyScore()
	}
	if a.CriticalityLevel != b.CriticalityLevel {
		return a.CriticalityLevel > b.CriticalityLevel
	}
	if a.AverageDailySales != b.AverageDailySales {
		return a.AverageDailySales > b.AverageDailySales
	}
	return a.Name < b.Name
}
