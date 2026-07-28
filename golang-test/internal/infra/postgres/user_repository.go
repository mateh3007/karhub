package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
)

const userColumns = `id, name, email, password, role, company_id, created_at, updated_at, deleted_at`

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) Create(ctx context.Context, user *entity.User) (*entity.User, error) {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO users (id, name, email, password, role, company_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, user.ID, user.Name, user.Email, user.Password, user.Role, user.CompanyID, user.CreatedAt, user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, user.ID)
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	return r.scanOne(ctx, `SELECT `+userColumns+` FROM users WHERE id = $1 AND deleted_at IS NULL`, id)
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	return r.scanOne(ctx, `SELECT `+userColumns+` FROM users WHERE email = $1 AND deleted_at IS NULL`, email)
}

func (r *UserRepository) FindByIDAndCompanyID(ctx context.Context, id, companyID string) (*entity.User, error) {
	return r.scanOne(ctx, `SELECT `+userColumns+` FROM users WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`, id, companyID)
}

func (r *UserRepository) FindPageByCompanyID(ctx context.Context, companyID string, params pagination.Params) (pagination.Result[*entity.User], error) {
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT count(*) FROM users WHERE company_id = $1 AND deleted_at IS NULL`, companyID,
	).Scan(&total); err != nil {
		return pagination.Result[*entity.User]{}, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT `+userColumns+`
		FROM users
		WHERE company_id = $1 AND deleted_at IS NULL
		ORDER BY name ASC
		LIMIT $2 OFFSET $3
	`, companyID, params.Limit, (params.Page-1)*params.Limit)
	if err != nil {
		return pagination.Result[*entity.User]{}, err
	}
	defer rows.Close()

	users, err := scanUsers(rows)
	if err != nil {
		return pagination.Result[*entity.User]{}, err
	}

	return pagination.Result[*entity.User]{
		Data:       users,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: pagination.TotalPages(total, params.Limit),
	}, nil
}

func (r *UserRepository) Update(ctx context.Context, user *entity.User) (*entity.User, error) {
	_, err := r.pool.Exec(ctx, `
		UPDATE users
		SET name = $2, email = $3, password = $4, role = $5, updated_at = now()
		WHERE id = $1
	`, user.ID, user.Name, user.Email, user.Password, user.Role)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, user.ID)
}

func (r *UserRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE users SET deleted_at = now() WHERE id = $1`, id)
	return err
}

func (r *UserRepository) scanOne(ctx context.Context, query string, args ...any) (*entity.User, error) {
	row := r.pool.QueryRow(ctx, query, args...)

	var u entity.User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &u.CompanyID, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func scanUsers(rows pgx.Rows) ([]*entity.User, error) {
	users := make([]*entity.User, 0)
	for rows.Next() {
		var u entity.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &u.CompanyID, &u.CreatedAt, &u.UpdatedAt, &u.DeletedAt); err != nil {
			return nil, err
		}
		users = append(users, &u)
	}
	return users, rows.Err()
}
