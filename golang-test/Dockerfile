# syntax=docker/dockerfile:1

FROM golang:1.25-alpine AS build
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /app/bin/api ./cmd/api
RUN CGO_ENABLED=0 go build -o /app/bin/migrate ./cmd/migrate

FROM alpine:3.20 AS production
WORKDIR /app
COPY --from=build /app/bin/api ./api
COPY --from=build /app/bin/migrate ./migrate
COPY migrations ./migrations

EXPOSE 8080
CMD ["./api"]
