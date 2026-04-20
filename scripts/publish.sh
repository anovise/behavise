#!/usr/bin/env bash
# publish.sh — Build, test, and publish all behavise packages to npm in dependency order.
#
# Usage:
#   ./scripts/publish.sh              # publish to npm (tag: latest)
#   ./scripts/publish.sh --dry-run    # simulate without actually publishing
#   ./scripts/publish.sh --tag beta   # publish under a dist-tag
#   ./scripts/publish.sh --tag beta --dry-run
#
# Publish order (dependency-safe):
#   1. @anovise/behavise-core
#   2. @anovise/behavise-pointer, @anovise/behavise-page, @anovise/behavise-interaction  (parallel-safe, sequential here)
#   3. @anovise/behavise

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRY_RUN=false
TAG="latest"

# ── Arg parsing ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --tag)     TAG="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if $DRY_RUN; then
  echo "ℹ️  DRY RUN — no packages will actually be published."
fi

# ── Helpers ───────────────────────────────────────────────────────────────────
step() { echo; echo "▶ $*"; }
ok()   { echo "  ✔ $*"; }
fail() { echo "  ✖ $*" >&2; exit 1; }

publish_pkg() {
  local dir="$1"
  local name
  name="$(node -p "require('$dir/package.json').name")"
  local version
  version="$(node -p "require('$dir/package.json').version")"

  echo "  📦 $name@$version"

  local args=("--tag" "$TAG" "--access" "public")
  if $DRY_RUN; then
    args+=("--dry-run")
  fi

  npm publish "$dir" "${args[@]}"
}

# ── 1. Verify npm login ───────────────────────────────────────────────────────
step "Checking npm authentication..."
if ! npm whoami --registry https://registry.npmjs.org &>/dev/null; then
  fail "Not logged in to npm. Run: npm login"
fi
ok "Logged in as $(npm whoami --registry https://registry.npmjs.org)"

# ── 2. Ensure clean git state ─────────────────────────────────────────────────
step "Checking git status..."
cd "$REPO_ROOT"
if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Working tree has uncommitted changes. Commit or stash them first."
fi
ok "Git working tree is clean."

# ── 3. Build all packages ─────────────────────────────────────────────────────
step "Building all packages..."
npm run build
ok "Build complete."

# ── 4. Run all tests ──────────────────────────────────────────────────────────
step "Running tests..."
npm run test
ok "All tests passed."

# ── 5. Publish in dependency order ───────────────────────────────────────────
step "Publishing packages (tag: $TAG)..."

PACKAGES=(
  "packages/core"
  "packages/pointer"
  "packages/page"
  "packages/interaction"
  "packages/behavise"
)

for pkg in "${PACKAGES[@]}"; do
  publish_pkg "$REPO_ROOT/$pkg"
done

# ── Done ──────────────────────────────────────────────────────────────────────
echo
if $DRY_RUN; then
  echo "✔ Dry run complete — no packages were published."
else
  echo "✔ All packages published successfully under tag \"$TAG\"."
fi
