package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/mateh3007/karhub/golang-test/internal/application/usecase/auth"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/dto"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/httputil"
)

type AuthHandler struct {
	registerUseCase *auth.RegisterUseCase
	loginUseCase    *auth.LoginUseCase
}

func NewAuthHandler(registerUseCase *auth.RegisterUseCase, loginUseCase *auth.LoginUseCase) *AuthHandler {
	return &AuthHandler{registerUseCase: registerUseCase, loginUseCase: loginUseCase}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := httputil.BindStrictJSON(c, &req); err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	result, err := h.registerUseCase.Execute(c.Request.Context(), auth.RegisterInput{
		CorporateName: req.CorporateName,
		TradeName:     req.TradeName,
		CNPJ:          req.CNPJ,
		Phone:         req.Phone,
		ContactEmail:  req.ContactEmail,
		AdminName:     req.AdminName,
		AdminPassword: req.AdminPassword,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, dto.NewRegisterResponse(result.Company, result.User))
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := httputil.BindStrictJSON(c, &req); err != nil {
		httputil.RespondValidationError(c, err)
		return
	}

	result, err := h.loginUseCase.Execute(c.Request.Context(), auth.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		httputil.RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.LoginResponse{AccessToken: result.AccessToken})
}
