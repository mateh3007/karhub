// Package jwtauth issues and validates the JWTs used across every protected
// route — same claim shape as node-js-test's IJwtPayload (sub, email, role,
// companyId), so a token's payload means the same thing in both backends.
package jwtauth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
)

var ErrInvalidToken = errors.New("invalid or expired token")

type Claims struct {
	Sub       string      `json:"sub"`
	Email     string      `json:"email"`
	Role      entity.Role `json:"role"`
	CompanyID string      `json:"companyId"`
	jwt.RegisteredClaims
}

type Service struct {
	secret    []byte
	expiresIn time.Duration
}

func NewService(secret string, expiresIn time.Duration) *Service {
	return &Service{secret: []byte(secret), expiresIn: expiresIn}
}

func (s *Service) Sign(userID, email string, role entity.Role, companyID string) (string, error) {
	now := time.Now()
	claims := Claims{
		Sub:       userID,
		Email:     email,
		Role:      role,
		CompanyID: companyID,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.expiresIn)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

func (s *Service) Verify(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return s.secret, nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
