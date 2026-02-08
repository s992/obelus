# Docker deployment

This deployment runs two containers:
- `obelus-api` (Fastify + tRPC)
- `obelus-web` (static SPA)

Postgres and Redis are **external dependencies** and must already exist.

## 1. Configure environment

Copy and edit:

```bash
cp docker-compose.env.example .env.docker
```

Set required values in `.env.docker`:
- `DATABASE_URL`
- `REDIS_URL`
- `SESSION_SECRET`
- `OPENLIBRARY_CONTACT_EMAIL`

## 2. Build images

```bash
docker compose --env-file .env.docker build
```

## 3. Apply database migrations

Run migrations once before starting traffic:

```bash
docker compose --env-file .env.docker run --rm api node dist/apps/api/src/db/migrate.js
```

## 4. Start Obelus

```bash
docker compose --env-file .env.docker up -d
```

Endpoints:
- Web: `http://localhost:8080`
- API: `http://localhost:4000`

## 5. Health checks

```bash
curl -f http://localhost:4000/livez
curl -f http://localhost:4000/readyz
curl -f http://localhost:8080/healthz
```

## Runtime image naming (GHCR-ready)

The compose file defaults to:
- `ghcr.io/your-org/obelus-api:local`
- `ghcr.io/your-org/obelus-web:local`

Override these tags/repositories in CI/CD as needed.

## Notes

- `WEB_API_BASE_URL` controls SPA runtime API base URL via `window.__OBELUS_CONFIG__`.
- Keep `APP_ORIGIN` aligned with the URL users access in browsers.
- If OAuth/OIDC is enabled, set all `OAUTH_*` fields together.
