#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if command -v tput &>/dev/null && tput setaf 1 &>/dev/null 2>&1; then
  RED="$(tput setaf 1)"
  RESET="$(tput sgr0)"
else
  RED=$'\033[0;31m'
  RESET=$'\033[0m'
fi

printf '%sWARNING: This will permanently delete all data.%s\n' "$RED" "$RESET"
echo "Press Ctrl+C within 5 seconds to cancel..."
sleep 5

docker compose down -v
docker compose up -d

echo "Database reset. App is running at http://localhost:8080"
