#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "'docker compose' is not available."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running or not accessible."
  exit 1
fi

if [ "$(docker compose ps -q backend)" = "" ]; then
  echo "Backend container is not created. Starting backend..."
  docker compose up -d backend
fi

backend_container_id="$(docker compose ps -q backend)"

if [ "$backend_container_id" = "" ]; then
  echo "Backend container could not be resolved."
  exit 1
fi

if [ "$(docker inspect -f '{{.State.Running}}' "$backend_container_id" 2>/dev/null || true)" != "true" ]; then
  echo "Backend container is not running. Starting backend..."
  docker compose up -d backend
fi

echo "Generating Swagger docs..."
docker compose exec -T backend php artisan l5-swagger:generate

echo "Done. Swagger docs updated."
