CREATE TYPE role AS ENUM ('ADMIN', 'USER');

CREATE TABLE companies (
    id             UUID PRIMARY KEY,
    cnpj           TEXT NOT NULL UNIQUE,
    corporate_name TEXT NOT NULL,
    trade_name     TEXT NOT NULL,
    contact_email  TEXT NOT NULL UNIQUE,
    phone          TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ
);

CREATE TABLE users (
    id         UUID PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       role NOT NULL,
    company_id UUID NOT NULL REFERENCES companies (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX users_company_id_name_idx ON users (company_id, name);

CREATE TABLE parts (
    id                  UUID PRIMARY KEY,
    name                TEXT NOT NULL,
    category            TEXT NOT NULL,
    current_stock       INTEGER NOT NULL,
    minimum_stock       INTEGER NOT NULL,
    average_daily_sales DOUBLE PRECISION NOT NULL,
    lead_time_days      INTEGER NOT NULL,
    unit_cost           DOUBLE PRECISION NOT NULL,
    criticality_level   INTEGER NOT NULL,
    company_id          UUID NOT NULL REFERENCES companies (id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX parts_company_id_category_idx ON parts (company_id, category);
CREATE INDEX parts_company_id_name_idx ON parts (company_id, name);
