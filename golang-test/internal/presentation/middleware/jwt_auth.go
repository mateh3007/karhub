package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/mateh3007/karhub/golang-test/internal/infra/jwtauth"
)

const contextUserKey = "user"

// JWTAuth mirrors node-js-test's JwtAuthGuard: missing token -> 401 "Missing
// authentication token"; invalid/expired -> 401 "Invalid or expired token".
// On success, the parsed claims are stashed in the Gin context for
// downstream handlers/middleware (see CurrentUser).
func JWTAuth(jwt *jwtauth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Missing authentication token"})
			return
		}

		claims, err := jwt.Verify(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Invalid or expired token"})
			return
		}

		c.Set(contextUserKey, claims)
		c.Next()
	}
}

// CurrentUser returns the authenticated caller's claims. Only meaningful
// behind JWTAuth — nil if called on an unauthenticated route.
func CurrentUser(c *gin.Context) *jwtauth.Claims {
	value, exists := c.Get(contextUserKey)
	if !exists {
		return nil
	}
	claims, _ := value.(*jwtauth.Claims)
	return claims
}
