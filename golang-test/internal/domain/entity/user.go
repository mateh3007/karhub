package entity

type User struct {
	BaseEntity
	Name      string
	Email     string
	Password  string
	Role      Role
	CompanyID string
}
