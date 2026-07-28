// Package testsupport holds hand-written fakes for the domain repository
// and cache interfaces, shared across usecase tests — the same spirit as
// node-js-test's manual jest mocks (no mocking library, each test wires up
// only the function fields it actually exercises).
package testsupport

import (
	"context"
	"time"

	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/domain/pagination"
)

type FakeCompanyRepository struct {
	CreateFn      func(ctx context.Context, company *entity.Company) (*entity.Company, error)
	FindByIDFn    func(ctx context.Context, id string) (*entity.Company, error)
	UpdateFn      func(ctx context.Context, company *entity.Company) (*entity.Company, error)
	DeleteFn      func(ctx context.Context, id string) error
	FindByCNPJFn  func(ctx context.Context, cnpj string) (*entity.Company, error)
	FindByEmailFn func(ctx context.Context, email string) (*entity.Company, error)
}

func (f *FakeCompanyRepository) Create(ctx context.Context, company *entity.Company) (*entity.Company, error) {
	return f.CreateFn(ctx, company)
}

func (f *FakeCompanyRepository) FindByID(ctx context.Context, id string) (*entity.Company, error) {
	return f.FindByIDFn(ctx, id)
}

func (f *FakeCompanyRepository) Update(ctx context.Context, company *entity.Company) (*entity.Company, error) {
	return f.UpdateFn(ctx, company)
}

func (f *FakeCompanyRepository) Delete(ctx context.Context, id string) error {
	return f.DeleteFn(ctx, id)
}

func (f *FakeCompanyRepository) FindByCNPJ(ctx context.Context, cnpj string) (*entity.Company, error) {
	return f.FindByCNPJFn(ctx, cnpj)
}

func (f *FakeCompanyRepository) FindByEmail(ctx context.Context, email string) (*entity.Company, error) {
	return f.FindByEmailFn(ctx, email)
}

type FakeUserRepository struct {
	CreateFn               func(ctx context.Context, user *entity.User) (*entity.User, error)
	FindByIDFn             func(ctx context.Context, id string) (*entity.User, error)
	UpdateFn               func(ctx context.Context, user *entity.User) (*entity.User, error)
	DeleteFn               func(ctx context.Context, id string) error
	FindByEmailFn          func(ctx context.Context, email string) (*entity.User, error)
	FindPageByCompanyIDFn  func(ctx context.Context, companyID string, params pagination.Params) (pagination.Result[*entity.User], error)
	FindByIDAndCompanyIDFn func(ctx context.Context, id, companyID string) (*entity.User, error)
}

func (f *FakeUserRepository) Create(ctx context.Context, user *entity.User) (*entity.User, error) {
	return f.CreateFn(ctx, user)
}

func (f *FakeUserRepository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	return f.FindByIDFn(ctx, id)
}

func (f *FakeUserRepository) Update(ctx context.Context, user *entity.User) (*entity.User, error) {
	return f.UpdateFn(ctx, user)
}

func (f *FakeUserRepository) Delete(ctx context.Context, id string) error {
	return f.DeleteFn(ctx, id)
}

func (f *FakeUserRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	return f.FindByEmailFn(ctx, email)
}

func (f *FakeUserRepository) FindPageByCompanyID(ctx context.Context, companyID string, params pagination.Params) (pagination.Result[*entity.User], error) {
	return f.FindPageByCompanyIDFn(ctx, companyID, params)
}

func (f *FakeUserRepository) FindByIDAndCompanyID(ctx context.Context, id, companyID string) (*entity.User, error) {
	return f.FindByIDAndCompanyIDFn(ctx, id, companyID)
}

type FakePartRepository struct {
	CreateFn               func(ctx context.Context, part *entity.Part) (*entity.Part, error)
	FindByIDFn             func(ctx context.Context, id string) (*entity.Part, error)
	UpdateFn               func(ctx context.Context, part *entity.Part) (*entity.Part, error)
	DeleteFn               func(ctx context.Context, id string) error
	FindByCompanyIDFn      func(ctx context.Context, companyID string) ([]*entity.Part, error)
	FindPageByCompanyIDFn  func(ctx context.Context, companyID string, params pagination.Params, category *string) (pagination.Result[*entity.Part], error)
	FindByIDAndCompanyIDFn func(ctx context.Context, id, companyID string) (*entity.Part, error)
}

func (f *FakePartRepository) Create(ctx context.Context, part *entity.Part) (*entity.Part, error) {
	return f.CreateFn(ctx, part)
}

func (f *FakePartRepository) FindByID(ctx context.Context, id string) (*entity.Part, error) {
	return f.FindByIDFn(ctx, id)
}

func (f *FakePartRepository) Update(ctx context.Context, part *entity.Part) (*entity.Part, error) {
	return f.UpdateFn(ctx, part)
}

func (f *FakePartRepository) Delete(ctx context.Context, id string) error {
	return f.DeleteFn(ctx, id)
}

func (f *FakePartRepository) FindByCompanyID(ctx context.Context, companyID string) ([]*entity.Part, error) {
	return f.FindByCompanyIDFn(ctx, companyID)
}

func (f *FakePartRepository) FindPageByCompanyID(ctx context.Context, companyID string, params pagination.Params, category *string) (pagination.Result[*entity.Part], error) {
	return f.FindPageByCompanyIDFn(ctx, companyID, params, category)
}

func (f *FakePartRepository) FindByIDAndCompanyID(ctx context.Context, id, companyID string) (*entity.Part, error) {
	return f.FindByIDAndCompanyIDFn(ctx, id, companyID)
}

// FakeCacheAdapter defaults to a working in-memory-free no-op: Get reports
// a miss and Set/Del succeed, unless a test overrides the *Fn fields.
type FakeCacheAdapter struct {
	GetFn func(ctx context.Context, key string, dest any) (bool, error)
	SetFn func(ctx context.Context, key string, value any, ttl time.Duration) error
	DelFn func(ctx context.Context, key string) error

	DelCalls []string
}

func (f *FakeCacheAdapter) Get(ctx context.Context, key string, dest any) (bool, error) {
	if f.GetFn != nil {
		return f.GetFn(ctx, key, dest)
	}
	return false, nil
}

func (f *FakeCacheAdapter) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	if f.SetFn != nil {
		return f.SetFn(ctx, key, value, ttl)
	}
	return nil
}

func (f *FakeCacheAdapter) Del(ctx context.Context, key string) error {
	f.DelCalls = append(f.DelCalls, key)
	if f.DelFn != nil {
		return f.DelFn(ctx, key)
	}
	return nil
}
