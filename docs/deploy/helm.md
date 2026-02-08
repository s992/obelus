# Helm deployment

Chart path: `charts/obelus`

This chart deploys:
- `api` Deployment + Service
- `web` Deployment + Service
- optional Ingress
- optional chart-managed Secret (not recommended for production)

Postgres and Redis are **external dependencies** and must already exist.

## 1. Prepare secrets (recommended: existing Secret refs)

Create a secret in your namespace:

```bash
kubectl create secret generic obelus-app-secrets \
  --from-literal=DATABASE_URL='postgres://...' \
  --from-literal=REDIS_URL='redis://...' \
  --from-literal=SESSION_SECRET='replace-with-at-least-16-characters'
```

If using OAuth/OIDC:

```bash
kubectl patch secret obelus-app-secrets -p '{"stringData":{"OAUTH_CLIENT_SECRET":"..."}}'
```

## 2. Create values file

Example `values-prod.yaml`:

```yaml
api:
  image:
    repository: ghcr.io/acme/obelus-api
    tag: "1.0.0"
  env:
    APP_ORIGIN: https://obelus.example.com
    TRUST_PROXY: "true"
    OPENLIBRARY_CONTACT_EMAIL: ops@example.com
  secretRefs:
    DATABASE_URL:
      existingSecret: obelus-app-secrets
      key: DATABASE_URL
    REDIS_URL:
      existingSecret: obelus-app-secrets
      key: REDIS_URL
    SESSION_SECRET:
      existingSecret: obelus-app-secrets
      key: SESSION_SECRET
    OAUTH_CLIENT_SECRET:
      existingSecret: obelus-app-secrets
      key: OAUTH_CLIENT_SECRET

web:
  image:
    repository: ghcr.io/acme/obelus-web
    tag: "1.0.0"
  env:
    API_BASE_URL: ""

ingress:
  enabled: true
  className: nginx
  host: obelus.example.com
  apiPaths:
    - /trpc
    - /csrf
    - /health
    - /livez
    - /readyz
  webPath: /
```

## 3. Install or upgrade

```bash
helm upgrade --install obelus ./charts/obelus -f values-prod.yaml
```

## 4. Verify

```bash
kubectl get deploy,svc,ingress -l app.kubernetes.io/instance=obelus
kubectl get pods -l app.kubernetes.io/instance=obelus
```

## Migration behavior

By default, API includes an init container that runs:

```text
node dist/apps/api/src/db/migrate.js
```

This ensures migrations are applied before API containers become ready.

## Optional: chart-managed secret

If you cannot pre-create secrets, set:

```yaml
secrets:
  create: true
  data:
    DATABASE_URL: "postgres://..."
    REDIS_URL: "redis://..."
    SESSION_SECRET: "..."
```

For production environments, prefer external secret management and `existingSecret` references.
