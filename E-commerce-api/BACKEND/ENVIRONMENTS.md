# Environment configuration

The API uses the same configuration schema for development, staging, and
production. Each environment must have a separate PostgreSQL database and its
own `SECRET_KEY` and Stripe credentials.

| Environment | Configuration source | Database |
| --- | --- | --- |
| Development | Local `BACKEND/.env`, copied from `.env.example` | `ecommerce_development` |
| Staging | Hosting provider environment variables, based on `.env.staging.example` | `ecommerce_staging` |
| Production | Hosting provider secret manager, based on `.env.production.example` | `ecommerce_production` |

## Local development

From `BACKEND`, copy `.env.example` to `.env`, then replace the local database
connection details and `SECRET_KEY`. The local `.env` is ignored by Git.

## Staging and production

Do not upload an `.env` file. Add each key in the matching template to the
hosting provider's environment-variable or secret-management interface. Use
unique database credentials and a unique random `SECRET_KEY` for each
environment. Generate a secret with a cryptographically secure source, for
example `python -c "import secrets; print(secrets.token_urlsafe(48))"`.

Set `ENVIRONMENT=production` only in production. At startup the API rejects a
production configuration with a short/default secret, a non-PostgreSQL URL,
wildcard or HTTP CORS origins, SQL statement logging, or development reset-token
exposure.

Production also requires `REDIS_URL`, a secure refresh-token cookie, an explicit
`lax` or `strict` cookie policy, and a password length of at least 12. Redis is
used to lock an email address or client IP for 15 minutes after five failed
login attempts. Do not enable the distributed limiter until the Redis service is
available; production startup will reject an incomplete configuration.

Before deploying, run `alembic upgrade head` against the target environment's
database and verify `/health` and `/readiness`. Never point staging or local
development at the production database.
