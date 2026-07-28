package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
)

const partColumns = `id, name, category, current_stock, minimum_stock, average_daily_sales, lead_time_days, unit_cost, criticality_level, company_id, created_at, updated_at, deleted_at`

type PartRepository struct {
	pool *pgxpool.Pool
}

func NewPartRepository(pool *pgxpool.Pool) *PartRepository {
	return &PartRepository{pool: pool}
}

func (r *PartRepository) Create(ctx context.Context, part *entity.Part) (*entity.Part, error) {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO parts (
			id, name, category, current_stock, minimum_stock, average_daily_sales,
			lead_time_days, unit_cost, criticality_level, company_id, created_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
	`,
		part.ID, part.Name, part.Category, part.CurrentStock, part.MinimumStock, part.AverageDailySales,
		part.LeadTimeDays, part.UnitCost, part.CriticalityLevel, part.CompanyID, part.CreatedAt, part.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, part.ID)
}

func (r *PartRepository) FindByID(ctx context.Context, id string) (*entity.Part, error) {
	return r.scanOne(ctx, `SELECT `+partColumns+` FROM parts WHERE id = $1 AND deleted_at IS NULL`, id)
}

func (r *PartRepository) FindByIDAndCompanyID(ctx context.Context, id, companyID string) (*entity.Part, error) {
	return r.scanOne(ctx, `SELECT `+partColumns+` FROM parts WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`, id, companyID)
}

// FindByCompanyID returns every non-deleted part for the company, unpaginated
// and in no particular order — the caller (restock priorities) sorts by
// urgency itself. See ADR 0012 in node-js-test for why this can't be a plain
// paginated/ordered query.
func (r *PartRepository) FindByCompanyID(ctx context.Context, companyID string) ([]*entity.Part, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+partColumns+` FROM parts WHERE company_id = $1 AND deleted_at IS NULL`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanParts(rows)
}

func (r *PartRepository) FindPageByCompanyID(ctx context.Context, companyID string, params pagination.Params, category *string) (pagination.Result[*entity.Part], error) {
	where := `company_id = $1 AND deleted_at IS NULL`
	args := []any{companyID}
	if category != nil && *category != "" {
		where += fmt.Sprintf(" AND category = $%d", len(args)+1)
		args = append(args, *category)
	}

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM parts WHERE `+where, args...).Scan(&total); err != nil {
		return pagination.Result[*entity.Part]{}, err
	}

	query := fmt.Sprintf(
		`SELECT %s FROM parts WHERE %s ORDER BY name ASC LIMIT $%d OFFSET $%d`,
		partColumns, where, len(args)+1, len(args)+2,
	)
	args = append(args, params.Limit, (params.Page-1)*params.Limit)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return pagination.Result[*entity.Part]{}, err
	}
	defer rows.Close()

	parts, err := scanParts(rows)
	if err != nil {
		return pagination.Result[*entity.Part]{}, err
	}

	return pagination.Result[*entity.Part]{
		Data:       parts,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: pagination.TotalPages(total, params.Limit),
	}, nil
}

func (r *PartRepository) Update(ctx context.Context, part *entity.Part) (*entity.Part, error) {
	_, err := r.pool.Exec(ctx, `
		UPDATE parts
		SET name = $2, category = $3, current_stock = $4, minimum_stock = $5,
		    average_daily_sales = $6, lead_time_days = $7, unit_cost = $8,
		    criticality_level = $9, updated_at = now()
		WHERE id = $1
	`,
		part.ID, part.Name, part.Category, part.CurrentStock, part.MinimumStock,
		part.AverageDailySales, part.LeadTimeDays, part.UnitCost, part.CriticalityLevel,
	)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, part.ID)
}

func (r *PartRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE parts SET deleted_at = now() WHERE id = $1`, id)
	return err
}

func (r *PartRepository) scanOne(ctx context.Context, query string, args ...any) (*entity.Part, error) {
	row := r.pool.QueryRow(ctx, query, args...)

	p, err := scanPart(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return p, nil
}

// rowScanner is satisfied by both pgx.Row (QueryRow) and pgx.Rows (Query),
// letting scanPart back both scanOne and scanParts.
type rowScanner interface {
	Scan(dest ...any) error
}

func scanPart(row rowScanner) (*entity.Part, error) {
	var p entity.Part
	err := row.Scan(
		&p.ID, &p.Name, &p.Category, &p.CurrentStock, &p.MinimumStock, &p.AverageDailySales,
		&p.LeadTimeDays, &p.UnitCost, &p.CriticalityLevel, &p.CompanyID, &p.CreatedAt, &p.UpdatedAt, &p.DeletedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func scanParts(rows pgx.Rows) ([]*entity.Part, error) {
	parts := make([]*entity.Part, 0)
	for rows.Next() {
		p, err := scanPart(rows)
		if err != nil {
			return nil, err
		}
		parts = append(parts, p)
	}
	return parts, rows.Err()
}
