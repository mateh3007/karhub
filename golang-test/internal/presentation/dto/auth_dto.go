package dto

import "github.com/mateh3007/karhub/golang-test/internal/domain/entity"

type RegisterRequest struct {
	CorporateName string `json:"corporateName" validate:"required"`
	TradeName     string `json:"tradeName" validate:"required"`
	CNPJ          string `json:"cnpj" validate:"required,len=14"`
	Phone         string `json:"phone" validate:"required"`
	ContactEmail  string `json:"contactEmail" validate:"required,email"`
	AdminName     string `json:"adminName" validate:"required"`
	AdminPassword string `json:"adminPassword" validate:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginResponse struct {
	AccessToken string `json:"accessToken"`
}

type RegisterResponse struct {
	Company CompanyResponse `json:"company"`
	User    UserResponse    `json:"user"`
}

func NewRegisterResponse(company *entity.Company, user *entity.User) RegisterResponse {
	return RegisterResponse{
		Company: NewCompanyResponse(company),
		User:    NewUserResponse(user),
	}
}
