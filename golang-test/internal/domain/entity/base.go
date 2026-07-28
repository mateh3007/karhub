package entity

import (
	"time"

	"github.com/google/uuid"
)

// BaseEntity holds the fields shared by every aggregate (Company, User,
// Part) — id, timestamps, and the soft-delete marker. Embedded by value so
// each entity gets its own copy of these fields plus their own data.
type BaseEntity struct {
	ID        string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time
}

// NewBaseEntity generates a fresh id and timestamps for a brand-new
// aggregate, mirroring node-js-test's BaseEntity constructor defaults.
func NewBaseEntity() BaseEntity {
	now := time.Now().UTC()
	return BaseEntity{
		ID:        uuid.NewString(),
		CreatedAt: now,
		UpdatedAt: now,
		DeletedAt: nil,
	}
}
