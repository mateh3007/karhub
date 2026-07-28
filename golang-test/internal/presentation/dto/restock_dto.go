package dto

import (
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
)

type RestockPriorityItem struct {
	PartID         string  `json:"partId"`
	Name           string  `json:"name"`
	CurrentStock   int     `json:"currentStock"`
	ProjectedStock float64 `json:"projectedStock"`
	MinimumStock   int     `json:"minimumStock"`
	UrgencyScore   float64 `json:"urgencyScore"`
}

func NewRestockPriorityItem(p *entity.Part) RestockPriorityItem {
	return RestockPriorityItem{
		PartID:         p.ID,
		Name:           p.Name,
		CurrentStock:   p.CurrentStock,
		ProjectedStock: p.ProjectedStock(),
		MinimumStock:   p.MinimumStock,
		UrgencyScore:   p.UrgencyScore(),
	}
}

// RestockPrioritiesResponse keeps the "priorities" key (matching the
// challenge's documented response shape) instead of the generic "data" used
// by /parts and /users — see ADR 0012 in node-js-test.
type RestockPrioritiesResponse struct {
	Priorities []RestockPriorityItem `json:"priorities"`
	Total      int                   `json:"total"`
	Page       int                   `json:"page"`
	Limit      int                   `json:"limit"`
	TotalPages int                   `json:"totalPages"`
}

func NewRestockPrioritiesResponse(result pagination.Result[*entity.Part]) RestockPrioritiesResponse {
	priorities := make([]RestockPriorityItem, len(result.Data))
	for i, p := range result.Data {
		priorities[i] = NewRestockPriorityItem(p)
	}
	return RestockPrioritiesResponse{
		Priorities: priorities,
		Total:      result.Total,
		Page:       result.Page,
		Limit:      result.Limit,
		TotalPages: result.TotalPages,
	}
}
