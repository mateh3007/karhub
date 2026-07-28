package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/part"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/dto"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/httputil"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/middleware"
)

type PartHandler struct {
	createUseCase  *part.CreateUseCase
	getAllUseCase  *part.GetAllUseCase
	getByIDUseCase *part.GetByIDUseCase
	updateUseCase  *part.UpdateUseCase
	deleteUseCase  *part.DeleteUseCase
}

func NewPartHandler(
	createUseCase *part.CreateUseCase,
	getAllUseCase *part.GetAllUseCase,
	getByIDUseCase *part.GetByIDUseCase,
	updateUseCase *part.UpdateUseCase,
	deleteUseCase *part.DeleteUseCase,
) *PartHandler {
	return &PartHandler{
		createUseCase:  createUseCase,
		getAllUseCase:  getAllUseCase,
		getByIDUseCase: getByIDUseCase,
		updateUseCase:  updateUseCase,
		deleteUseCase:  deleteUseCase,
	}
}

func (h *PartHandler) Create(c *gin.Context) {
	var req dto.CreatePartRequest
	if err := httputil.BindStrictJSON(c, &req); err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	claims := middleware.CurrentUser(c)
	created, err := h.createUseCase.Execute(c.Request.Context(), part.CreateInput{
		Name:              req.Name,
		Category:          req.Category,
		CurrentStock:      req.CurrentStock,
		MinimumStock:      req.MinimumStock,
		AverageDailySales: req.AverageDailySales,
		LeadTimeDays:      req.LeadTimeDays,
		UnitCost:          req.UnitCost,
		CriticalityLevel:  req.CriticalityLevel,
		CompanyID:         claims.CompanyID,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, dto.NewPartResponse(created))
}

func (h *PartHandler) FindAll(c *gin.Context) {
	page, limit, err := httputil.ParsePagination(c)
	if err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	var category *string
	if raw := c.Query("category"); raw != "" {
		category = &raw
	}

	claims := middleware.CurrentUser(c)
	result, err := h.getAllUseCase.Execute(c.Request.Context(), part.GetAllInput{
		CompanyID: claims.CompanyID,
		Category:  category,
		Page:      page,
		Limit:     limit,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.NewPartsPageResponse(result))
}

func (h *PartHandler) FindByID(c *gin.Context) {
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

	c.JSON(http.StatusOK, dto.NewPartResponse(found))
}

func (h *PartHandler) Update(c *gin.Context) {
	id, ok := httputil.ParseUUIDParam(c, "id")
	if !ok {
		httputil.RespondValidationError(c, errors.New("id must be a valid uuid"))
		return
	}

	var req dto.UpdatePartRequest
	if err := httputil.BindStrictJSON(c, &req); err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	claims := middleware.CurrentUser(c)
	updated, err := h.updateUseCase.Execute(c.Request.Context(), part.UpdateInput{
		ID:                id,
		CompanyID:         claims.CompanyID,
		Name:              req.Name,
		Category:          req.Category,
		CurrentStock:      req.CurrentStock,
		MinimumStock:      req.MinimumStock,
		AverageDailySales: req.AverageDailySales,
		LeadTimeDays:      req.LeadTimeDays,
		UnitCost:          req.UnitCost,
		CriticalityLevel:  req.CriticalityLevel,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.NewPartResponse(updated))
}

func (h *PartHandler) Delete(c *gin.Context) {
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
