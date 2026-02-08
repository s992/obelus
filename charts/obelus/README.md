# obelus Helm chart

Deploys the Obelus API and web SPA as separate workloads.

## Design

- External Postgres and Redis only (no bundled database/cache subcharts)
- API and web deployed independently (separate Deployments/Services)
- Optional Ingress with single host and path routing
- Secret references preferred (`api.secretRefs.*`)
- Optional chart-managed secret (`secrets.create=true`) for non-production scenarios

## Install

```bash
helm upgrade --install obelus ./charts/obelus -f values.yaml
```

See `docs/deploy/helm.md` and `docs/configuration.md` for full configuration.
