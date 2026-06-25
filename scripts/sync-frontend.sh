#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND_PUBLIC="$ROOT/backend/public"

# Use nvm Node if available (Angular CLI needs >= 22.22.3)
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use 22.23.1 2>/dev/null || nvm use 22 2>/dev/null || true
fi

echo "Building Angular frontend..."
cd "$FRONTEND"
node node_modules/@angular/cli/bin/ng.js build

echo "Copying dist to backend/public..."
rm -rf "$BACKEND_PUBLIC"
mkdir -p "$BACKEND_PUBLIC"
cp -r "$FRONTEND/dist/frontend/browser/"* "$BACKEND_PUBLIC/"

echo "Done. Frontend synced to backend/public"
