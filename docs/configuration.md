# Configuration reference

## API environment variables

| Variable | Required | Default | Sensitive | Description |
|---|---|---|---|---|
| `NODE_ENV` | No | `development` | No | Runtime mode (`development`, `test`, `production`). |
| `API_PORT` | No | `4000` | No | API listen port. |
| `TRUST_PROXY` | No | `false` | No | Enables Fastify proxy trust when behind ingress/LB. |
| `APP_ORIGIN` | No | `http://localhost:5173` | No | Primary allowed browser origin for CORS/cookies. |
| `APP_ORIGINS` | No | empty | No | Comma-separated extra allowed origins. |
| `DATABASE_URL` | Yes in production | local postgres URL | Yes | Postgres connection string. |
| `REDIS_URL` | Yes for production cache | `redis://localhost:6379` | Yes | Redis connection string (cache layer). |
| `SESSION_COOKIE_NAME` | No | `obelus_session` | No | Session cookie name. |
| `CSRF_COOKIE_NAME` | No | `obelus_csrf` | No | CSRF cookie name. |
| `SESSION_SECRET` | Yes in production | `change-this-development-secret` | Yes | JWT/session signing secret (min 16 chars). |
| `OAUTH_PROVIDER` | No | `oidc` | No | OAuth provider type (`oidc` or `oauth2`). |
| `OAUTH_ISSUER` | Conditionally | empty | No | OIDC issuer URL. |
| `OAUTH_JWKS_URL` | Conditionally | empty | No | JWKS endpoint URL. |
| `OAUTH_CLIENT_ID` | Conditionally | empty | No | OAuth client id. |
| `OAUTH_CLIENT_SECRET` | Conditionally | empty | Yes | OAuth client secret. |
| `OAUTH_AUTHORIZE_URL` | Conditionally | empty | No | Authorization endpoint URL. |
| `OAUTH_TOKEN_URL` | Conditionally | empty | No | Token endpoint URL. |
| `OAUTH_USERINFO_URL` | Conditionally | empty | No | Userinfo endpoint URL. |
| `OAUTH_REDIRECT_URI` | Conditionally | empty | No | Redirect/callback URL. |
| `OAUTH_SCOPES` | No | `openid email profile` | No | Space-separated OAuth scopes. |
| `DRIZZLE_MIGRATIONS_DIR` | No | `apps/api/drizzle` | No | Override migration folder path for runtime migrate command. |

`OAUTH_*` fields are all-or-nothing: set all required fields or leave all unset.

## Web configuration

### Build-time (Vite)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | empty | Build-time API base URL fallback for SPA requests. |

### Runtime (`window.__OBELUS_CONFIG__`)

| Key | Required | Default | Description |
|---|---|---|---|
| `API_BASE_URL` | No | empty | Runtime API base URL injected by container startup; if empty, app falls back to `VITE_API_URL`, then `http(s)://<host>:4000`. |

`apps/web/public/config.js` defines the runtime object and is overwritten by the web container entrypoint in Docker/Kubernetes.

## Docker Compose variables

`docker-compose.yml` uses these variables (usually via `--env-file .env.docker`):

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | External Postgres DSN. |
| `REDIS_URL` | Yes | External Redis DSN. |
| `SESSION_SECRET` | Yes | API signing secret. |
| `APP_ORIGIN` | No | Browser URL for CORS/cookies (default `http://localhost:8080`). |
| `APP_ORIGINS` | No | Additional allowed origins. |
| `TRUST_PROXY` | No | Proxy trust toggle. |
| `WEB_API_BASE_URL` | No | Runtime API base URL for web container (`API_BASE_URL`). |
| `OAUTH_*` | No | Optional OAuth/OIDC settings; set consistently. |

## Helm values overview

Primary values are in `charts/obelus/values.yaml`:
- `api.image.*`, `web.image.*`
- `api.env.*`, `web.env.API_BASE_URL`
- `api.secretRefs.*` for existing secret names/keys
- `secrets.create` and `secrets.data.*` for optional chart-managed secret
- `api.migrationInitContainer.*`
- `ingress.*` for host/path routing
