#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NPM_TAG="${NPM_TAG:-latest}"
NPM_ACCESS="${NPM_ACCESS:-public}"
NPM_OTP="${NPM_OTP:-}"
NPM_OTP_FILE="${NPM_OTP_FILE:-}"
NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-$ROOT_DIR/.npm-cache}"
DRY_RUN=0
SKIP_TESTS=0
OTP_CODES=()
OTP_INDEX=0

usage() {
  cat <<'EOF'
Usage: bash scripts/publish-npm.sh [options]

Options:
  --dry-run          Run npm publish in dry-run mode.
  --skip-tests       Skip typecheck and test before publish.
  --tag <tag>        npm dist-tag. Default: latest.
  --access <access>  npm access. Default: public.
  --otp <otp>        npm one-time password for 2FA.
  --otp-file <file>  Read one OTP/recovery code per published package.
  -h, --help         Show this help message.

Environment:
  NPM_TAG            Same as --tag.
  NPM_ACCESS         Same as --access.
  NPM_OTP            Same as --otp.
  NPM_OTP_FILE       Same as --otp-file.
  NPM_CONFIG_CACHE   npm cache directory. Default: ./.npm-cache.

Publish order:
  1. @nine1ie/a2ui-vue-core
  2. @nine1ie/a2ui-vue
  3. @nine1ie/a2ui-vue-transport
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
    --otp-file)
      NPM_OTP_FILE="${2:?Missing value for --otp-file}"
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
export NPM_CONFIG_CACHE

if [[ -n "$NPM_OTP_FILE" ]]; then
  if [[ ! -f "$NPM_OTP_FILE" ]]; then
    echo "OTP file not found: $NPM_OTP_FILE" >&2
    exit 1
  fi
  while IFS= read -r code || [[ -n "$code" ]]; do
    [[ -z "$code" || "$code" == \#* ]] && continue
    OTP_CODES+=("$code")
  done < "$NPM_OTP_FILE"
fi

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
  elif [[ "${#OTP_CODES[@]}" -gt 0 ]]; then
    if [[ "$OTP_INDEX" -ge "${#OTP_CODES[@]}" ]]; then
      echo "Not enough OTP/recovery codes for ${package_name}" >&2
      exit 1
    fi
    args+=(--otp "${OTP_CODES[$OTP_INDEX]}")
    OTP_INDEX=$((OTP_INDEX + 1))
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
