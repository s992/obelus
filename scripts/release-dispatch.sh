#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  pnpm release --version vX.Y.Z [--prerelease] [--no-watch]

Options:
  --version     Required release version (v-prefixed semver).
  --prerelease  Marks release as prerelease (requires prerelease semver).
  --no-watch    Dispatches workflow and exits without waiting for completion.
USAGE
}

VERSION=""
PRERELEASE="false"
WATCH="true"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      VERSION="${2:-}"
      shift 2
      ;;
    --prerelease)
      PRERELEASE="true"
      shift
      ;;
    --no-watch)
      WATCH="false"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  echo "--version is required."
  usage
  exit 1
fi

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid version '$VERSION'. Expected vX.Y.Z or vX.Y.Z-prerelease."
  exit 1
fi

if [[ "$PRERELEASE" == "true" && ! "$VERSION" =~ - ]]; then
  echo "--prerelease requires a prerelease version (for example, v1.2.3-rc.1)."
  exit 1
fi

if [[ "$PRERELEASE" != "true" && "$VERSION" =~ - ]]; then
  echo "Prerelease version detected. Pass --prerelease to continue."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI authentication is required. Run: gh auth login"
  exit 1
fi

gh workflow run release.yml --ref main -f version="$VERSION" -f prerelease="$PRERELEASE"
echo "Dispatched release workflow for $VERSION (prerelease=$PRERELEASE)."

if [[ "$WATCH" != "true" ]]; then
  exit 0
fi

run_id=""
for _ in $(seq 1 15); do
  run_id="$(gh run list \
    --workflow release.yml \
    --event workflow_dispatch \
    --branch main \
    --limit 1 \
    --json databaseId \
    --jq '.[0].databaseId')"

  if [[ -n "$run_id" && "$run_id" != "null" ]]; then
    break
  fi

  sleep 2
done

if [[ -z "$run_id" || "$run_id" == "null" ]]; then
  echo "Release workflow was dispatched, but run id lookup failed."
  echo "Check with: gh run list --workflow release.yml --event workflow_dispatch --branch main"
  exit 1
fi

echo "Watching workflow run $run_id..."
gh run watch "$run_id" --exit-status
