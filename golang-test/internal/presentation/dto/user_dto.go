package dto

import (
	"time"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
)

type CreateUserRequest struct {
	Name     string      `json:"name" validate:"required"`
	Email    string      `json:"email" validate:"required,email"`
	Password string      `json:"password" validate:"required,min=8"`
	Role     entity.Role `json:"role" validate:"required,oneof=ADMIN USER"`
}

type UpdateUserRequest struct {
	Name     *string      `json:"name" validate:"omitempty"`
	Email    *string      `json:"email" validate:"omitempty,email"`
	Password *string      `json:"password" validate:"omitempty,min=8"`
	Role     *entity.Role `json:"role" validate:"omitempty,oneof=ADMIN USER"`
}

type UserResponse struct {
	ID        string      `json:"id"`
	Name      string      `json:"name"`
	Email     string      `json:"email"`
	Role      entity.Role `json:"role"`
	CompanyID string      `json:"companyId"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
}

func NewUserResponse(u *entity.User) UserResponse {
	return UserResponse{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Role:      u.Role,
		CompanyID: u.CompanyID,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

type UsersPageResponse struct {
	Data       []UserResponse `json:"data"`
	Total      int            `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"totalPages"`
}

func NewUsersPageResponse(result pagination.Result[*entity.User]) UsersPageResponse {
	data := make([]UserResponse, len(result.Data))
	for i, u := range result.Data {
		data[i] = NewUserResponse(u)
	}
	return UsersPageResponse{
		Data:       data,
		Total:      result.Total,
		Page:       result.Page,
		Limit:      result.Limit,
		TotalPages: result.TotalPages,
	}
}
