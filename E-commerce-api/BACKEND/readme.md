# Backend database migrations

## Fresh database

The migration history starts at `0001_initial_schema` and creates the full
PostgreSQL schema required by the current SQLAlchemy models.

```powershell
cd BACKEND
alembic upgrade head
```

## Existing database created with the retired migration history

Do **not** run `alembic upgrade head` against it. The replacement `0001`
migration is a baseline and would attempt to create tables that already exist.

1. Back up the database.
2. Compare its schema with the current SQLAlchemy models and resolve any drift
   using a dedicated, reviewed data/schema migration.
3. After confirming the schema matches, mark it as using the new baseline:

```powershell
alembic stamp --purge 0001_initial_schema
```

`stamp` updates only Alembic's version metadata; it does not change tables or
data. Run this first in staging and keep the backup until production has been
verified.

## CI validation

The GitHub Actions workflow in `.github/workflows/migrations.yml` creates a
fresh PostgreSQL database, applies every migration, and runs `alembic check`.
It prevents migration/model drift from being merged.
