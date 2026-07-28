package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/part"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/dto"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/httputil"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/middleware"
)

type RestockHandler struct {
	getRestockPrioritiesUseCase *part.GetRestockPrioritiesUseCase
}

func NewRestockHandler(getRestockPrioritiesUseCase *part.GetRestockPrioritiesUseCase) *RestockHandler {
	return &RestockHandler{getRestockPrioritiesUseCase: getRestockPrioritiesUseCase}
}

func (h *RestockHandler) Priorities(c *gin.Context) {
	page, limit, err := httputil.ParsePagination(c)
	if err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	claims := middleware.CurrentUser(c)
	result, err := h.getRestockPrioritiesUseCase.Execute(c.Request.Context(), part.GetRestockPrioritiesInput{
		CompanyID: claims.CompanyID,
		Page:      page,
		Limit:     limit,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.NewRestockPrioritiesResponse(result))
}
