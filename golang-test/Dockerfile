# syntax=docker/dockerfile:1
#
# Placeholder: golang-test has no Go code yet (see ../README.md). This
# assumes a standard `go.mod` + root `main.go` once the challenge is
# implemented in Go. Gated behind the `golang` Compose profile in the root
# docker-compose.yml, so it's never built by a plain `docker compose up`.

FROM golang:1.23-alpine AS build
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /app/bin/server .

FROM alpine:3.20 AS production
WORKDIR /app
COPY --from=build /app/bin/server ./server

EXPOSE 8080
CMD ["./server"]
