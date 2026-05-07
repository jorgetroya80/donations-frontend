#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose pull
docker compose up -d

echo "Updated to the latest version. App is running at http://localhost:8080"
