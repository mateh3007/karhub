package entity

type Company struct {
	BaseEntity
	CNPJ          string
	CorporateName string
	TradeName     string
	ContactEmail  string
	Phone         string
}
