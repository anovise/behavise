#!/usr/bin/env bash
# deploy.sh — Build the showcase app and push it to anovise/anovise.github.io (gh-pages branch)
#
# Usage:
#   npm run deploy
#   ./scripts/deploy.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHOWCASE_DIR="$REPO_ROOT/apps/example"
PAGES_REPO="anovise/anovise.github.io"
DEPLOY_PATH="behavise/example"
TMP_DIR="$(mktemp -d)"
PAGES_DIR="$TMP_DIR/pages"

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# ── 1. Build showcase ──────────────────────────────────────────────────────────
echo "▶ Building showcase..."
cd "$SHOWCASE_DIR"
npm run build
echo "✔ Build complete → $SHOWCASE_DIR/dist"

# ── 2. Clone gh-pages branch ──────────────────────────────────────────────────
echo "▶ Cloning $PAGES_REPO (gh-pages)..."
gh repo clone "$PAGES_REPO" "$PAGES_DIR" -- --branch gh-pages --single-branch --depth 1 --quiet

# ── 3. Copy dist to deploy path ───────────────────────────────────────────────
echo "▶ Copying dist → $DEPLOY_PATH..."
rm -rf "$PAGES_DIR/$DEPLOY_PATH"
mkdir -p "$PAGES_DIR/$DEPLOY_PATH"
cp -r "$SHOWCASE_DIR/dist/." "$PAGES_DIR/$DEPLOY_PATH/"

# ── 4. Commit and push ────────────────────────────────────────────────────────
cd "$PAGES_DIR"
git add "$DEPLOY_PATH"

if git diff --cached --quiet; then
  echo "ℹ Nothing changed — skipping push."
  exit 0
fi

COMMIT_SHA="$(cd "$REPO_ROOT" && git rev-parse --short HEAD)"
git commit -m "feat(showcase): deploy behavise showcase @ $COMMIT_SHA

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push origin gh-pages --quiet

echo "✔ Deployed to https://anovise.github.io/$DEPLOY_PATH/"
