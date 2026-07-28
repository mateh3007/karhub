-- The official postgres image only creates one database on first init
-- (via POSTGRES_DB), and that one is shared by node-js-test. golang-test
-- deliberately runs against its own database (see golang-test's ADR on
-- an independent database/migrations), so this script — mounted into
-- /docker-entrypoint-initdb.d — creates it on a fresh volume.
--
-- Only runs the first time the postgres_data volume is initialized; if
-- the volume already exists from before this file was added, create the
-- database manually once: docker exec <postgres-container> psql -U karhub -c "CREATE DATABASE karhub_go;"
CREATE DATABASE karhub_go;
