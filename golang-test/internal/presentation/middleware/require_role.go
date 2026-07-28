package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
)

// RequireRole mirrors node-js-test's RolesGuard: no roles given means any
// authenticated caller passes; otherwise the caller's role must be one of
// the given roles, or 403 "Insufficient permissions". Must run after
// JWTAuth.
func RequireRole(roles ...entity.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		if len(roles) == 0 {
			c.Next()
			return
		}

		claims := CurrentUser(c)
		if claims == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Missing authentication token"})
			return
		}

		for _, role := range roles {
			if claims.Role == role {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Insufficient permissions"})
	}
}
