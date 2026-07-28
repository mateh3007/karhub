package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/company"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/dto"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/httputil"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/middleware"
)

type CompanyHandler struct {
	createUseCase  *company.CreateUseCase
	getAllUseCase  *company.GetAllUseCase
	getByIDUseCase *company.GetByIDUseCase
	updateUseCase  *company.UpdateUseCase
	deleteUseCase  *company.DeleteUseCase
}

func NewCompanyHandler(
	createUseCase *company.CreateUseCase,
	getAllUseCase *company.GetAllUseCase,
	getByIDUseCase *company.GetByIDUseCase,
	updateUseCase *company.UpdateUseCase,
	deleteUseCase *company.DeleteUseCase,
) *CompanyHandler {
	return &CompanyHandler{
		createUseCase:  createUseCase,
		getAllUseCase:  getAllUseCase,
		getByIDUseCase: getByIDUseCase,
		updateUseCase:  updateUseCase,
		deleteUseCase:  deleteUseCase,
	}
}

func (h *CompanyHandler) Create(c *gin.Context) {
	var req dto.CreateCompanyRequest
	if err := httputil.BindStrictJSON(c, &req); err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	created, err := h.createUseCase.Execute(c.Request.Context(), company.CreateInput{
		CorporateName: req.CorporateName,
		TradeName:     req.TradeName,
		CNPJ:          req.CNPJ,
		ContactEmail:  req.ContactEmail,
		Phone:         req.Phone,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, dto.NewCompanyResponse(created))
}

func (h *CompanyHandler) FindAll(c *gin.Context) {
	claims := middleware.CurrentUser(c)

	companies, err := h.getAllUseCase.Execute(c.Request.Context(), claims.CompanyID)
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.NewCompanyResponses(companies))
}

func (h *CompanyHandler) FindByID(c *gin.Context) {
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

	c.JSON(http.StatusOK, dto.NewCompanyResponse(found))
}

func (h *CompanyHandler) Update(c *gin.Context) {
	id, ok := httputil.ParseUUIDParam(c, "id")
	if !ok {
		httputil.RespondValidationError(c, errors.New("id must be a valid uuid"))
		return
	}

	var req dto.UpdateCompanyRequest
	if err := httputil.BindStrictJSON(c, &req); err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	claims := middleware.CurrentUser(c)
	updated, err := h.updateUseCase.Execute(c.Request.Context(), company.UpdateInput{
		ID:              id,
		CallerCompanyID: claims.CompanyID,
		CorporateName:   req.CorporateName,
		TradeName:       req.TradeName,
		ContactEmail:    req.ContactEmail,
		Phone:           req.Phone,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.NewCompanyResponse(updated))
}

func (h *CompanyHandler) Delete(c *gin.Context) {
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
