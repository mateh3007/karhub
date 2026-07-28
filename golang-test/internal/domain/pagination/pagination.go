// Package pagination mirrors node-js-test's IPaginationParams/IPaginatedResult
// (src/shared/interfaces/pagination.interface.ts) — the same page/limit
// contract, shared by every paginated resource.
package pagination

type Params struct {
	Page  int
	Limit int
}

type Result[T any] struct {
	Data       []T
	Total      int
	Page       int
	Limit      int
	TotalPages int
}

// TotalPages mirrors Math.ceil(total / limit) using integer arithmetic.
func TotalPages(total, limit int) int {
	if limit <= 0 {
		return 0
	}
	return (total + limit - 1) / limit
}
