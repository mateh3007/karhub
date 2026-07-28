// Package apperror carries the handful of HTTP-meaningful error kinds a
// usecase can return (mirroring Nest's NotFoundException/BadRequestException/
// etc.) without the application layer importing anything HTTP-specific —
// the presentation layer maps Kind to a status code.
package apperror

type Kind int

const (
	KindNotFound Kind = iota
	KindBadRequest
	KindUnauthorized
	KindForbidden
)

type Error struct {
	Kind    Kind
	Message string
}

func (e *Error) Error() string {
	return e.Message
}

func NotFound(message string) *Error {
	return &Error{Kind: KindNotFound, Message: message}
}

func BadRequest(message string) *Error {
	return &Error{Kind: KindBadRequest, Message: message}
}

func Unauthorized(message string) *Error {
	return &Error{Kind: KindUnauthorized, Message: message}
}

func Forbidden(message string) *Error {
	return &Error{Kind: KindForbidden, Message: message}
}
