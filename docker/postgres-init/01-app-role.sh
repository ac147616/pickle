#!/bin/sh
# Creates the restricted runtime role the API connects as (DATABASE_URL).
# Migrations run as the POSTGRES_USER superuser (DIRECT_URL / MIGRATE_DATABASE_URL)
# instead, so that a later REVOKE of UPDATE/DELETE on append-only tables actually
# has teeth -- table owners and superusers always bypass GRANT/REVOKE checks.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pickle_app') THEN
      CREATE ROLE pickle_app LOGIN PASSWORD '$APP_DB_PASSWORD';
    ELSE
      ALTER ROLE pickle_app LOGIN PASSWORD '$APP_DB_PASSWORD';
    END IF;
  END
  \$\$;

  GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO pickle_app;
  GRANT USAGE ON SCHEMA public TO pickle_app;

  -- Applies to tables the migrator creates from now on, so future migrations
  -- don't need to remember to grant access to every new table by hand.
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pickle_app;
EOSQL
