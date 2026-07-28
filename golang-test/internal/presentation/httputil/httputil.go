// Package httputil holds the small pieces every handler needs that aren't
// specific to one resource: strict JSON body binding (rejecting unknown
// fields, mirroring Nest's forbidNonWhitelisted), pagination query parsing,
// UUID path param validation (mirroring Nest's ParseUUIDPipe), and mapping
// application errors to HTTP responses.
package httputil

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"

	"github.com/mateh3007/karhub/golang-test/internal/application/apperror"
)

var validate = validator.New()

// BindStrictJSON decodes the request body into dest, rejecting any field not
// present on dest, then runs `validate` struct-tag validation. Returns a
// user-facing error message ready to send as-is in a 400 response.
func BindStrictJSON(c *gin.Context, dest any) error {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return err
	}

	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dest); err != nil {
		return fmt.Errorf("invalid request body: %w", err)
	}

	if err := validate.Struct(dest); err != nil {
		return err
	}
	return nil
}

const (
	defaultPage  = 1
	defaultLimit = 20
	maxLimit     = 100
)

// ParsePagination mirrors PaginationQueryDto: page defaults to 1 (min 1),
// limit defaults to 20 (min 1, max 100) — out of bounds is a 400.
func ParsePagination(c *gin.Context) (page, limit int, err error) {
	page = defaultPage
	limit = defaultLimit

	if raw := c.Query("page"); raw != "" {
		page, err = strconv.Atoi(raw)
		if err != nil || page < 1 {
			return 0, 0, errors.New("page must be an integer >= 1")
		}
	}

	if raw := c.Query("limit"); raw != "" {
		limit, err = strconv.Atoi(raw)
		if err != nil || limit < 1 || limit > maxLimit {
			return 0, 0, errors.New("limit must be an integer between 1 and 100")
		}
	}

	return page, limit, nil
}

// ParseUUIDParam validates a route param as a UUID, mirroring Nest's
// ParseUUIDPipe (400 on a malformed id, before it ever reaches a query).
func ParseUUIDParam(c *gin.Context, name string) (string, bool) {
	value := c.Param(name)
	if _, err := uuid.Parse(value); err != nil {
		return "", false
	}
	return value, true
}

func RespondValidationError(c *gin.Context, err error) {
	c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": err.Error()})
}

// RespondError maps an apperror.Error to its HTTP status; anything else is
// logged and reported as a generic 500 (never leaking internal details).
func RespondError(c *gin.Context, err error) {
	var appErr *apperror.Error
	if errors.As(err, &appErr) {
		status := http.StatusInternalServerError
		switch appErr.Kind {
		case apperror.KindNotFound:
			status = http.StatusNotFound
		case apperror.KindBadRequest:
			status = http.StatusBadRequest
		case apperror.KindUnauthorized:
			status = http.StatusUnauthorized
		case apperror.KindForbidden:
			status = http.StatusForbidden
		}
		c.AbortWithStatusJSON(status, gin.H{"message": appErr.Message})
		return
	}

	log.Printf("unexpected error: %v", err)
	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
}
