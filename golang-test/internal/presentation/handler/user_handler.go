package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/user"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/dto"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/httputil"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/middleware"
)

type UserHandler struct {
	createUseCase  *user.CreateUseCase
	getAllUseCase  *user.GetAllUseCase
	getByIDUseCase *user.GetByIDUseCase
	updateUseCase  *user.UpdateUseCase
	deleteUseCase  *user.DeleteUseCase
}

func NewUserHandler(
	createUseCase *user.CreateUseCase,
	getAllUseCase *user.GetAllUseCase,
	getByIDUseCase *user.GetByIDUseCase,
	updateUseCase *user.UpdateUseCase,
	deleteUseCase *user.DeleteUseCase,
) *UserHandler {
	return &UserHandler{
		createUseCase:  createUseCase,
		getAllUseCase:  getAllUseCase,
		getByIDUseCase: getByIDUseCase,
		updateUseCase:  updateUseCase,
		deleteUseCase:  deleteUseCase,
	}
}

func (h *UserHandler) Create(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := httputil.BindStrictJSON(c, &req); err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	claims := middleware.CurrentUser(c)
	created, err := h.createUseCase.Execute(c.Request.Context(), user.CreateInput{
		Name:      req.Name,
		Email:     req.Email,
		Password:  req.Password,
		Role:      req.Role,
		CompanyID: claims.CompanyID,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, dto.NewUserResponse(created))
}

func (h *UserHandler) FindAll(c *gin.Context) {
	page, limit, err := httputil.ParsePagination(c)
	if err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	claims := middleware.CurrentUser(c)
	result, err := h.getAllUseCase.Execute(c.Request.Context(), user.GetAllInput{
		CompanyID: claims.CompanyID,
		Page:      page,
		Limit:     limit,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.NewUsersPageResponse(result))
}

func (h *UserHandler) FindByID(c *gin.Context) {
	id, ok := httputil.ParseUUIDParam(c, "id")
	if !ok {
		httputil.RespondValidationError(c, errors.New("id must be a valid uuid"))
		return
	}
	claims := middleware.CurrentUser(c)

	found, err := h.getByIDUseCase.Execute(c.Request.Context(), id, claims.CompanyID)
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.NewUserResponse(found))
}

func (h *UserHandler) Update(c *gin.Context) {
	id, ok := httputil.ParseUUIDParam(c, "id")
	if !ok {
		httputil.RespondValidationError(c, errors.New("id must be a valid uuid"))
		return
	}

	var req dto.UpdateUserRequest
	if err := httputil.BindStrictJSON(c, &req); err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	claims := middleware.CurrentUser(c)
	updated, err := h.updateUseCase.Execute(c.Request.Context(), user.UpdateInput{
		ID:        id,
		CompanyID: claims.CompanyID,
		Name:      req.Name,
		Email:     req.Email,
		Password:  req.Password,
		Role:      req.Role,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.NewUserResponse(updated))
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, ok := httputil.ParseUUIDParam(c, "id")
	if !ok {
		httputil.RespondValidationError(c, errors.New("id must be a valid uuid"))
		return
	}
	claims := middleware.CurrentUser(c)

	if err := h.deleteUseCase.Execute(c.Request.Context(), id, claims.CompanyID); err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}
