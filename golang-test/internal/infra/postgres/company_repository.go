package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
)

const companyColumns = `id, cnpj, corporate_name, trade_name, contact_email, phone, created_at, updated_at, deleted_at`

type CompanyRepository struct {
	pool *pgxpool.Pool
}

func NewCompanyRepository(pool *pgxpool.Pool) *CompanyRepository {
	return &CompanyRepository{pool: pool}
}

func (r *CompanyRepository) Create(ctx context.Context, company *entity.Company) (*entity.Company, error) {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO companies (id, cnpj, corporate_name, trade_name, contact_email, phone, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, company.ID, company.CNPJ, company.CorporateName, company.TradeName, company.ContactEmail, company.Phone, company.CreatedAt, company.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, company.ID)
}

func (r *CompanyRepository) FindByID(ctx context.Context, id string) (*entity.Company, error) {
	return r.scanOne(ctx, `SELECT `+companyColumns+` FROM companies WHERE id = $1 AND deleted_at IS NULL`, id)
}

func (r *CompanyRepository) FindByCNPJ(ctx context.Context, cnpj string) (*entity.Company, error) {
	return r.scanOne(ctx, `SELECT `+companyColumns+` FROM companies WHERE cnpj = $1 AND deleted_at IS NULL`, cnpj)
}

func (r *CompanyRepository) FindByEmail(ctx context.Context, email string) (*entity.Company, error) {
	return r.scanOne(ctx, `SELECT `+companyColumns+` FROM companies WHERE contact_email = $1 AND deleted_at IS NULL`, email)
}

func (r *CompanyRepository) Update(ctx context.Context, company *entity.Company) (*entity.Company, error) {
	_, err := r.pool.Exec(ctx, `
		UPDATE companies
		SET corporate_name = $2, trade_name = $3, contact_email = $4, phone = $5, updated_at = now()
		WHERE id = $1
	`, company.ID, company.CorporateName, company.TradeName, company.ContactEmail, company.Phone)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, company.ID)
}

func (r *CompanyRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE companies SET deleted_at = now() WHERE id = $1`, id)
	return err
}

func (r *CompanyRepository) scanOne(ctx context.Context, query string, args ...any) (*entity.Company, error) {
	row := r.pool.QueryRow(ctx, query, args...)

	var c entity.Company
	err := row.Scan(&c.ID, &c.CNPJ, &c.CorporateName, &c.TradeName, &c.ContactEmail, &c.Phone, &c.CreatedAt, &c.UpdatedAt, &c.DeletedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}
