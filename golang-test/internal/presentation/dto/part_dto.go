package dto

import (
	"time"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
)

type CreatePartRequest struct {
	Name              string  `json:"name" validate:"required"`
	Category          string  `json:"category" validate:"required"`
	CurrentStock      int     `json:"currentStock" validate:"min=0"`
	MinimumStock      int     `json:"minimumStock" validate:"min=0"`
	AverageDailySales float64 `json:"averageDailySales" validate:"min=0"`
	LeadTimeDays      int     `json:"leadTimeDays" validate:"min=0"`
	UnitCost          float64 `json:"unitCost" validate:"min=0"`
	CriticalityLevel  int     `json:"criticalityLevel" validate:"min=1,max=5"`
}

type UpdatePartRequest struct {
	Name              *string  `json:"name" validate:"omitempty"`
	Category          *string  `json:"category" validate:"omitempty"`
	CurrentStock      *int     `json:"currentStock" validate:"omitempty,min=0"`
	MinimumStock      *int     `json:"minimumStock" validate:"omitempty,min=0"`
	AverageDailySales *float64 `json:"averageDailySales" validate:"omitempty,min=0"`
	LeadTimeDays      *int     `json:"leadTimeDays" validate:"omitempty,min=0"`
	UnitCost          *float64 `json:"unitCost" validate:"omitempty,min=0"`
	CriticalityLevel  *int     `json:"criticalityLevel" validate:"omitempty,min=1,max=5"`
}

type PartResponse struct {
	ID                string    `json:"id"`
	Name              string    `json:"name"`
	Category          string    `json:"category"`
	CurrentStock      int       `json:"currentStock"`
	MinimumStock      int       `json:"minimumStock"`
	AverageDailySales float64   `json:"averageDailySales"`
	LeadTimeDays      int       `json:"leadTimeDays"`
	UnitCost          float64   `json:"unitCost"`
	CriticalityLevel  int       `json:"criticalityLevel"`
	CompanyID         string    `json:"companyId"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

func NewPartResponse(p *entity.Part) PartResponse {
	return PartResponse{
		ID:                p.ID,
		Name:              p.Name,
		Category:          p.Category,
		CurrentStock:      p.CurrentStock,
		MinimumStock:      p.MinimumStock,
		AverageDailySales: p.AverageDailySales,
		LeadTimeDays:      p.LeadTimeDays,
		UnitCost:          p.UnitCost,
		CriticalityLevel:  p.CriticalityLevel,
		CompanyID:         p.CompanyID,
		CreatedAt:         p.CreatedAt,
		UpdatedAt:         p.UpdatedAt,
	}
}

type PartsPageResponse struct {
	Data       []PartResponse `json:"data"`
	Total      int            `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"totalPages"`
}

func NewPartsPageResponse(result pagination.Result[*entity.Part]) PartsPageResponse {
	data := make([]PartResponse, len(result.Data))
	for i, p := range result.Data {
		data[i] = NewPartResponse(p)
	}
	return PartsPageResponse{
		Data:       data,
		Total:      result.Total,
		Page:       result.Page,
		Limit:      result.Limit,
		TotalPages: result.TotalPages,
	}
}
