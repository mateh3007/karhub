package dto

import (
	"time"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
)

type CreateCompanyRequest struct {
	CorporateName string `json:"corporateName" validate:"required"`
	TradeName     string `json:"tradeName" validate:"required"`
	CNPJ          string `json:"cnpj" validate:"required,len=14"`
	ContactEmail  string `json:"contactEmail" validate:"required,email"`
	Phone         string `json:"phone" validate:"required"`
}

type UpdateCompanyRequest struct {
	CorporateName *string `json:"corporateName" validate:"omitempty"`
	TradeName     *string `json:"tradeName" validate:"omitempty"`
	ContactEmail  *string `json:"contactEmail" validate:"omitempty,email"`
	Phone         *string `json:"phone" validate:"omitempty"`
}

type CompanyResponse struct {
	ID            string    `json:"id"`
	CNPJ          string    `json:"cnpj"`
	CorporateName string    `json:"corporateName"`
	TradeName     string    `json:"tradeName"`
	ContactEmail  string    `json:"contactEmail"`
	Phone         string    `json:"phone"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func NewCompanyResponse(c *entity.Company) CompanyResponse {
	return CompanyResponse{
		ID:            c.ID,
		CNPJ:          c.CNPJ,
		CorporateName: c.CorporateName,
		TradeName:     c.TradeName,
		ContactEmail:  c.ContactEmail,
		Phone:         c.Phone,
		CreatedAt:     c.CreatedAt,
		UpdatedAt:     c.UpdatedAt,
	}
}

func NewCompanyResponses(companies []*entity.Company) []CompanyResponse {
	result := make([]CompanyResponse, len(companies))
	for i, c := range companies {
		result[i] = NewCompanyResponse(c)
	}
	return result
}
