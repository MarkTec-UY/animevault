#!/bin/sh
set -eu

cd /var/www/html

sync_env_value() {
  key="$1"
  value="${2:-}"

  if [ -z "$value" ]; then
    return 0
  fi

  escaped_value=$(printf '%s' "$value" | sed 's/[\/&]/\\&/g')

  if grep -q "^${key}=" .env 2>/dev/null; then
    sed -i "s/^${key}=.*/${key}=${escaped_value}/" .env
  else
    printf '\n%s=%s\n' "$key" "$value" >> .env
  fi
}

if [ ! -f .env ]; then
  if [ -f .env.docker.example ]; then
    cp .env.docker.example .env
  elif [ -f .env.example ]; then
    cp .env.example .env
  fi
fi

if [ ! -f vendor/autoload.php ]; then
  composer install
fi

sync_env_value APP_URL "${APP_URL:-}"
sync_env_value DB_CONNECTION "${DB_CONNECTION:-}"
sync_env_value DB_HOST "${DB_HOST:-}"
sync_env_value DB_PORT "${DB_PORT:-}"
sync_env_value DB_DATABASE "${DB_DATABASE:-}"
sync_env_value DB_USERNAME "${DB_USERNAME:-}"
sync_env_value DB_PASSWORD "${DB_PASSWORD:-}"
sync_env_value CACHE_STORE "${CACHE_STORE:-}"
sync_env_value SESSION_DRIVER "${SESSION_DRIVER:-}"
sync_env_value QUEUE_CONNECTION "${QUEUE_CONNECTION:-}"
sync_env_value REDIS_CLIENT "${REDIS_CLIENT:-}"
sync_env_value REDIS_HOST "${REDIS_HOST:-}"
sync_env_value REDIS_PORT "${REDIS_PORT:-}"

if [ -n "${DB_HOST:-}" ]; then
  until nc -z "${DB_HOST}" "${DB_PORT:-5432}"; do
    sleep 1
  done
fi

if [ -n "${REDIS_HOST:-}" ]; then
  until nc -z "${REDIS_HOST}" "${REDIS_PORT:-6379}"; do
    sleep 1
  done
fi

if ! grep -Eq '^APP_KEY=base64:' .env 2>/dev/null; then
  php artisan key:generate --force
fi

php artisan optimize:clear || true
php artisan migrate --force

exec "$@"
