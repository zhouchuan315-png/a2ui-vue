#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NPM_TAG="${NPM_TAG:-latest}"
NPM_ACCESS="${NPM_ACCESS:-public}"
NPM_OTP="${NPM_OTP:-}"
DRY_RUN=0
SKIP_TESTS=0

usage() {
  cat <<'EOF'
Usage: bash scripts/publish-npm.sh [options]

Options:
  --dry-run          Run npm publish in dry-run mode.
  --skip-tests       Skip typecheck and test before publish.
  --tag <tag>        npm dist-tag. Default: latest.
  --access <access>  npm access. Default: public.
  --otp <otp>        npm one-time password for 2FA.
  -h, --help         Show this help message.

Environment:
  NPM_TAG            Same as --tag.
  NPM_ACCESS         Same as --access.
  NPM_OTP            Same as --otp.

Publish order:
  1. @a2ui/vue-core
  2. @a2ui/vue
  3. @a2ui/vue-transport
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=1
      shift
      ;;
    --tag)
      NPM_TAG="${2:?Missing value for --tag}"
      shift 2
      ;;
    --access)
      NPM_ACCESS="${2:?Missing value for --access}"
      shift 2
      ;;
    --otp)
      NPM_OTP="${2:?Missing value for --otp}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

cd "$ROOT_DIR"

if [[ "$DRY_RUN" -eq 0 ]]; then
  npm whoami >/dev/null
fi

if [[ "$SKIP_TESTS" -eq 0 ]]; then
  pnpm typecheck
  pnpm test
fi

pnpm build

publish_package() {
  local package_dir="$1"
  local package_name
  package_name="$(node -p "require('./${package_dir}/package.json').name")"

  local args=(publish --access "$NPM_ACCESS" --tag "$NPM_TAG" --no-git-checks)
  if [[ "$DRY_RUN" -eq 1 ]]; then
    args+=(--dry-run)
  fi
  if [[ -n "$NPM_OTP" ]]; then
    args+=(--otp "$NPM_OTP")
  fi

  echo "Publishing ${package_name} from ${package_dir}"
  (
    cd "$package_dir"
    pnpm "${args[@]}"
  )
}

publish_package "packages/core"
publish_package "packages/renderer"
publish_package "packages/transport"

echo "Publish finished."
