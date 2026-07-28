package entity

type Role string

const (
	RoleAdmin Role = "ADMIN"
	RoleUser  Role = "USER"
)

func (r Role) Valid() bool {
	return r == RoleAdmin || r == RoleUser
}
