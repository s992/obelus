# Obelus Helm Chart

A self-hosted book tracking application.

## Prerequisites

- Kubernetes 1.26+
- Helm 3.x
- A [Hardcover](https://hardcover.app) API token

## Installation

```bash
helm dependency update charts/obelus

helm install obelus charts/obelus \
  --namespace obelus --create-namespace \
  --set secrets.authTokenSecret="$(openssl rand -base64 32)" \
  --set secrets.cookieSecret="$(openssl rand -base64 32)" \
  --set secrets.hardcoverApiToken="YOUR_TOKEN" \
  --set config.baseUrl="https://books.example.com"
```

## Uninstalling

```bash
helm uninstall obelus -n obelus
```

> **Note:** PVCs for PostgreSQL and Redis are retained by default. Delete them manually if you want a clean removal:
> `kubectl delete pvc -n obelus -l app.kubernetes.io/instance=obelus`

## Parameters

### Application

| Parameter          | Description            | Default               |
| ------------------ | ---------------------- | --------------------- |
| `replicaCount`     | Number of app replicas | `1`                   |
| `image.repository` | Container image        | `ghcr.io/s992/obelus` |
| `image.tag`        | Image tag              | `latest`              |
| `image.pullPolicy` | Pull policy            | `IfNotPresent`        |
| `imagePullSecrets` | Registry pull secrets  | `[]`                  |

### Configuration

| Parameter           | Description                                    | Default            |
| ------------------- | ---------------------------------------------- | ------------------ |
| `config.baseUrl`    | Public URL for the application                 | `http://localhost` |
| `config.apiPort`    | Internal API port                              | `3000`             |
| `config.clientPort` | Internal client port                           | `80`               |
| `config.logLevel`   | Log level (`debug`, `info`, `warn`, `error`)   | `info`             |
| `config.redisUrl`   | Redis URL override (auto-constructed if empty) | `""`               |

### Secrets

| Parameter                   | Description                                         | Default |
| --------------------------- | --------------------------------------------------- | ------- |
| `secrets.existingSecret`    | Use an existing Secret instead of creating one      | `""`    |
| `secrets.authTokenSecret`   | JWT signing secret                                  | `""`    |
| `secrets.cookieSecret`      | Cookie signing secret                               | `""`    |
| `secrets.hardcoverApiToken` | Hardcover API token                                 | `""`    |
| `secrets.databaseUrl`       | PostgreSQL URL override (auto-constructed if empty) | `""`    |

When using `secrets.existingSecret`, the Secret must contain these keys: `auth-token-secret`, `cookie-secret`, `hardcover-api-token`, `database-url`.

### Migration

| Parameter           | Description                        | Default |
| ------------------- | ---------------------------------- | ------- |
| `migration.enabled` | Run database migrations on startup | `true`  |

### Service

| Parameter      | Description  | Default     |
| -------------- | ------------ | ----------- |
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80`        |

### Ingress

| Parameter             | Description             | Default                                                        |
| --------------------- | ----------------------- | -------------------------------------------------------------- |
| `ingress.enabled`     | Enable ingress          | `false`                                                        |
| `ingress.className`   | Ingress class name      | `""`                                                           |
| `ingress.annotations` | Ingress annotations     | `{}`                                                           |
| `ingress.hosts`       | Ingress hosts and paths | `[{host: obelus.local, paths: [{path: /, pathType: Prefix}]}]` |
| `ingress.tls`         | TLS configuration       | `[]`                                                           |

### PostgreSQL (Bitnami subchart)

| Parameter                             | Description       | Default  |
| ------------------------------------- | ----------------- | -------- |
| `postgresql.enabled`                  | Deploy PostgreSQL | `true`   |
| `postgresql.auth.username`            | Database user     | `obelus` |
| `postgresql.auth.password`            | Database password | `obelus` |
| `postgresql.auth.database`            | Database name     | `obelus` |
| `postgresql.primary.persistence.size` | PVC size          | `1Gi`    |

Set `postgresql.enabled: false` and provide `secrets.databaseUrl` to use an external PostgreSQL instance.

See the [Bitnami PostgreSQL chart](https://github.com/bitnami/charts/tree/main/bitnami/postgresql) for all available parameters.

### Redis (Bitnami subchart)

| Parameter                       | Description                 | Default      |
| ------------------------------- | --------------------------- | ------------ |
| `redis.enabled`                 | Deploy Redis                | `true`       |
| `redis.architecture`            | Redis architecture          | `standalone` |
| `redis.auth.enabled`            | Enable Redis authentication | `false`      |
| `redis.master.persistence.size` | PVC size                    | `1Gi`        |

Set `redis.enabled: false` and provide `config.redisUrl` to use an external Redis instance.

See the [Bitnami Redis chart](https://github.com/bitnami/charts/tree/main/bitnami/redis) for all available parameters.

### Other

| Parameter                    | Description                               | Default                |
| ---------------------------- | ----------------------------------------- | ---------------------- |
| `serviceAccount.create`      | Create a service account                  | `true`                 |
| `serviceAccount.name`        | Service account name (generated if empty) | `""`                   |
| `serviceAccount.annotations` | Service account annotations               | `{}`                   |
| `resources`                  | CPU/memory resource requests and limits   | `{}`                   |
| `livenessProbe`              | Liveness probe configuration              | HTTP GET `/api/livez`  |
| `readinessProbe`             | Readiness probe configuration             | HTTP GET `/api/readyz` |

## Using an External Database

```yaml
postgresql:
  enabled: false

secrets:
  databaseUrl: 'postgres://user:pass@your-db-host:5432/obelus'
```

## Using an External Redis

```yaml
redis:
  enabled: false

config:
  redisUrl: 'redis://your-redis-host:6379'
```
