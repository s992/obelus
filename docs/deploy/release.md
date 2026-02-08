# Release process

Obelus release automation is driven by GitHub Actions and GHCR.

## Prerequisites

- Push access to the repository.
- `gh` CLI installed and authenticated (`gh auth login`).
- `main` branch checked and healthy in CI.

## Single-command release

Stable release:

```bash
pnpm release --version v1.2.3
```

Prerelease:

```bash
pnpm release --version v1.2.3-rc.1 --prerelease
```

The command dispatches `.github/workflows/release.yml` on `main` and watches it to completion.

## What the workflow does

1. Validates version format and prerelease consistency.
2. Syncs `charts/obelus/Chart.yaml` (`version` + `appVersion`) to the release version without the leading `v`.
3. Creates and pushes annotated git tag `vX.Y.Z`.
4. Builds and publishes `obelus-api` and `obelus-web` images to GHCR.
5. Creates a GitHub Release with generated notes (commit log based).

## GHCR tag policy

Stable (`vX.Y.Z`):

- `vX.Y.Z`
- `vX.Y`
- `vX`
- `latest`

Prerelease (`vX.Y.Z-...` with `--prerelease`):

- `vX.Y.Z-...` only

## Failure recovery

If a release fails partway:

1. Inspect failed run logs in GitHub Actions.
2. Delete incorrect GitHub release/tag if needed:
   - `gh release delete <tag> --yes`
   - `git push origin :refs/tags/<tag>`
3. Re-run `pnpm release ...` with corrected inputs.
